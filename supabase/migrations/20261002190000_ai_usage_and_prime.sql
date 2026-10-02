-- Faz 5 (8.52 ekonomi kararları): yapay zekâ kullanım kaydı + kota, Prime üyelik alanı.
-- Para birimi: PawCoin = mevcut PP defteri (point_transactions / award_pati_puan_internal).

-- 1) Prime üyelik (satın alma Faz 6'da mağaza üzerinden; istemci bu alanı yazamaz)
alter table public.profiles add column if not exists prime_until timestamptz;

create or replace function public.guard_profile_prime() returns trigger language plpgsql as $$
begin
    if current_user in ('authenticated', 'anon') then
        new.prime_until := old.prime_until;
    end if;
    return new;
end;
$$;

do $$ begin
    if not exists (select 1 from pg_trigger where tgname = 'profiles_guard_prime') then
        create trigger profiles_guard_prime before update on public.profiles
            for each row execute function public.guard_profile_prime();
    end if;
end $$;

create or replace function public.has_prime(p_user uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
    select coalesce((select prime_until > now() from profiles where id = p_user), false);
$$;
revoke all on function public.has_prime(uuid) from public, anon;
grant execute on function public.has_prime(uuid) to authenticated, service_role;

-- 2) Yapay zekâ kullanım kaydı
create table if not exists public.ai_usage (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    kind text not null check (kind in ('message', 'photo')),
    endpoint text not null,
    source text not null check (source in ('free', 'prime', 'pawcoin')),
    pawcoin_spent integer not null default 0,
    status text not null default 'pending' check (status in ('pending', 'ok', 'failed')),
    model text,
    input_tokens integer,
    output_tokens integer,
    cost_usd numeric(12, 6) not null default 0,
    created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_day_idx on public.ai_usage (user_id, created_at desc);
create index if not exists ai_usage_month_idx on public.ai_usage (created_at) where status = 'ok';

alter table public.ai_usage enable row level security;
do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'ai_usage' and policyname = 'Own ai usage') then
        create policy "Own ai usage" on public.ai_usage for select to authenticated using (user_id = auth.uid());
    end if;
end $$;
grant select on public.ai_usage to authenticated;

-- Limitler tek yerde (8.52): ücretsiz günde 5 mesaj + 1 fotoğraf, Prime 60 + 10, ek hak PawCoin ile
-- (mesaj 10, fotoğraf 30), herkes için günlük sert tavan, aylık 50 $ bütçe (40 $'da ücretsiz hak düşer).
create or replace function public.ai_limits() returns jsonb language sql immutable as $$
    select jsonb_build_object(
        'free_message', 5, 'free_photo', 1,
        'free_message_low', 2, 'free_photo_low', 0,
        'prime_message', 60, 'prime_photo', 10,
        'hard_message', 100, 'hard_photo', 20,
        'price_message', 10, 'price_photo', 30,
        'budget_usd', 50, 'budget_low_usd', 40
    );
$$;

create or replace function public.ai_quota_status() returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid();
    l jsonb := ai_limits();
    v_prime boolean;
    v_month numeric;
    v_low boolean;
    v_msg int; v_photo int;
    v_balance int;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    v_prime := has_prime(v_uid);
    select coalesce(sum(cost_usd), 0) into v_month from ai_usage
     where status = 'ok' and created_at >= date_trunc('month', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_low := v_month >= (l->>'budget_low_usd')::numeric;
    select count(*) filter (where kind = 'message'), count(*) filter (where kind = 'photo')
      into v_msg, v_photo
      from ai_usage
     where user_id = v_uid and status <> 'failed' and source <> 'pawcoin'
       and created_at >= date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    select pati_puan_balance into v_balance from profiles where id = v_uid;
    return jsonb_build_object(
        'prime', v_prime,
        'capacity_reached', v_month >= (l->>'budget_usd')::numeric,
        'message_limit', case when v_prime then (l->>'prime_message')::int when v_low then (l->>'free_message_low')::int else (l->>'free_message')::int end,
        'photo_limit', case when v_prime then (l->>'prime_photo')::int when v_low then (l->>'free_photo_low')::int else (l->>'free_photo')::int end,
        'message_used', v_msg,
        'photo_used', v_photo,
        'price_message', (l->>'price_message')::int,
        'price_photo', (l->>'price_photo')::int,
        'balance', coalesce(v_balance, 0)
    );
end;
$$;

-- Çağrıdan ÖNCE hak ayırır. Hak yoksa ve p_pay ise PawCoin düşer. Dönen usage_id, ai_finish'e verilir.
create or replace function public.ai_consume(p_kind text, p_endpoint text, p_pay boolean default false) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid();
    l jsonb := ai_limits();
    q jsonb;
    v_used int; v_limit int; v_total int; v_hard int; v_price int;
    v_id uuid;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    if p_kind not in ('message', 'photo') then raise exception 'Geçersiz tür'; end if;

    perform pg_advisory_xact_lock(hashtext('ai_consume:' || v_uid::text));
    q := ai_quota_status();

    if (q->>'capacity_reached')::boolean then
        return jsonb_build_object('allowed', false, 'reason', 'capacity');
    end if;

    select count(*) into v_total from ai_usage
     where user_id = v_uid and kind = p_kind and status <> 'failed'
       and created_at >= date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_hard := (l->>case when p_kind = 'message' then 'hard_message' else 'hard_photo' end)::int;
    if v_total >= v_hard then
        return jsonb_build_object('allowed', false, 'reason', 'daily_cap');
    end if;

    v_used := (q->>case when p_kind = 'message' then 'message_used' else 'photo_used' end)::int;
    v_limit := (q->>case when p_kind = 'message' then 'message_limit' else 'photo_limit' end)::int;

    if v_used < v_limit then
        insert into ai_usage (user_id, kind, endpoint, source)
        values (v_uid, p_kind, p_endpoint, case when (q->>'prime')::boolean then 'prime' else 'free' end)
        returning id into v_id;
        return jsonb_build_object('allowed', true, 'usage_id', v_id, 'source', 'quota', 'remaining', v_limit - v_used - 1);
    end if;

    v_price := (q->>case when p_kind = 'message' then 'price_message' else 'price_photo' end)::int;
    if not p_pay then
        return jsonb_build_object('allowed', false, 'reason', 'quota', 'price', v_price,
                                  'balance', (q->>'balance')::int, 'prime', (q->>'prime')::boolean);
    end if;
    if (q->>'balance')::int < v_price then
        return jsonb_build_object('allowed', false, 'reason', 'balance', 'price', v_price, 'balance', (q->>'balance')::int);
    end if;

    insert into ai_usage (user_id, kind, endpoint, source, pawcoin_spent)
    values (v_uid, p_kind, p_endpoint, 'pawcoin', v_price)
    returning id into v_id;
    perform award_pati_puan_internal(v_uid, -v_price, 'Yapay zekâ ek hakkı', 'spend', v_id::text);
    return jsonb_build_object('allowed', true, 'usage_id', v_id, 'source', 'pawcoin', 'spent', v_price);
end;
$$;

-- Servis rolü: çağrı bitince sonucu ve maliyeti yazar; başarısızsa PawCoin iade edilir.
create or replace function public.ai_finish(p_id uuid, p_ok boolean, p_model text default null,
                                            p_input_tokens integer default null, p_output_tokens integer default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
    u ai_usage%rowtype;
    v_cost numeric;
begin
    select * into u from ai_usage where id = p_id for update;
    if u.id is null or u.status <> 'pending' then return; end if;
    -- gemini-2.5-flash-lite: 0,10 $ / 1M girdi, 0,40 $ / 1M çıktı belirteci
    v_cost := coalesce(p_input_tokens, 0) * 0.10 / 1000000 + coalesce(p_output_tokens, 0) * 0.40 / 1000000;
    update ai_usage
       set status = case when p_ok then 'ok' else 'failed' end,
           model = p_model, input_tokens = p_input_tokens, output_tokens = p_output_tokens,
           cost_usd = case when p_ok then v_cost else 0 end
     where id = p_id;
    if not p_ok and u.pawcoin_spent > 0 then
        perform award_pati_puan_internal(u.user_id, u.pawcoin_spent, 'Yapay zekâ iadesi', 'other', u.id::text);
    end if;
end;
$$;

revoke all on function public.ai_limits() from public, anon;
revoke all on function public.ai_quota_status() from public, anon;
revoke all on function public.ai_consume(text, text, boolean) from public, anon;
revoke all on function public.ai_finish(uuid, boolean, text, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_limits() to authenticated;
grant execute on function public.ai_quota_status() to authenticated;
grant execute on function public.ai_consume(text, text, boolean) to authenticated;
grant execute on function public.ai_finish(uuid, boolean, text, integer, integer) to service_role;
