-- point_transactions.source izinli listesinde 'reward' yok (quest/badge/streak/spend/redemption/admin/other).
-- Ödüller 'quest' kaynağıyla yazılır; sunucu ödülleri reference_id'deki '<kural>@<dönem>' biçiminden
-- tanınır (eski istemci kayıtlarının referansında '@' yok). Tekrar ve günlük sınır bu kayıtlara bakar.

create unique index if not exists point_transactions_rule_reward_once
    on public.point_transactions (user_id, reference_id)
    where source = 'quest' and reference_id like '%@%';

create or replace function public.claim_reward(p_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_rule public.reward_rules%rowtype;
    v_local timestamp := now() at time zone 'Europe/Istanbul';
    v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_bucket text;
    v_ref text;
    v_used integer;
    v_award integer;
    v_balance integer;
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;

    select * into v_rule from public.reward_rules where key = p_key and is_active;
    if not found then
        raise exception 'Geçersiz ödül';
    end if;

    v_bucket := case v_rule.period
        when 'daily' then to_char(v_local, 'YYYY-MM-DD')
        when 'weekly' then to_char(v_local, 'IYYY-"W"IW')
        when 'monthly' then to_char(v_local, 'YYYY-MM')
        else 'once'
    end;
    v_ref := p_key || '@' || v_bucket;

    -- Aynı kullanıcının eşzamanlı iki isteği günlük sınırı birlikte aşamasın.
    perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':reward', 0));

    if exists (select 1 from public.point_transactions
               where user_id = v_user and source = 'quest' and reference_id = v_ref) then
        select pati_puan_balance into v_balance from public.profiles where id = v_user;
        return jsonb_build_object('awarded', 0, 'already_claimed', true, 'capped', false, 'balance', v_balance);
    end if;

    v_award := v_rule.pp;
    if v_rule.counts_toward_daily_cap then
        select coalesce(sum(t.amount), 0) into v_used
        from public.point_transactions t
        join public.reward_rules r on r.key = split_part(t.reference_id, '@', 1)
        where t.user_id = v_user and t.source = 'quest' and t.reference_id like '%@%'
          and r.counts_toward_daily_cap and t.created_at >= v_day_start;
        v_award := greatest(0, least(v_award, 200 - v_used));
    end if;

    -- Sınıra takılıp 0 verilse bile kayıt düşülür: aynı ödül her açılışta yeniden denenmez.
    insert into public.point_transactions (user_id, amount, reason, source, reference_id)
    values (v_user, v_award, v_rule.label, 'quest', v_ref);

    update public.profiles set pati_puan_balance = pati_puan_balance + v_award
    where id = v_user
    returning pati_puan_balance into v_balance;

    return jsonb_build_object('awarded', v_award, 'already_claimed', false, 'capped', v_award < v_rule.pp, 'balance', v_balance);
end;
$$;

revoke execute on function public.claim_reward(text) from public, anon;
grant execute on function public.claim_reward(text) to authenticated;
