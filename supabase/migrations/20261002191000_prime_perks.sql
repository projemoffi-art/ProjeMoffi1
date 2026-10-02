-- Faz 5: Prime ayrıcalıkları (8.52) — haftada 2. seri kalkanı, her ay 500 PawCoin.

-- Seri kalkanı: haftada 1 hak, Prime'a 2 (hafta, kalkanın KULLANILDIĞI tarihe göre sayılır)
create or replace function public.use_streak_shield(p_covered_date date)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare
    v_user_id uuid := auth.uid();
    v_current_week date := date_trunc('week', current_date)::date;
    v_limit int;
    v_used int;
    v_has_walk boolean;
begin
    if v_user_id is null then raise exception 'Giriş gerekli'; end if;

    -- Kötüye kullanımı sınırla: sadece son 2 gün içindeki bir tarih için kalkan kullanılabilir
    if p_covered_date < current_date - 2 or p_covered_date >= current_date then
        raise exception 'Geçersiz tarih';
    end if;

    perform 1 from profiles where id = v_user_id for update;
    v_limit := case when has_prime(v_user_id) then 2 else 1 end;
    select count(*) into v_used from streak_shield_uses
     where user_id = v_user_id and created_at >= v_current_week;
    if v_used >= v_limit then
        raise exception 'Bu hafta için kalkanınız kalmadı';
    end if;

    select exists(
        select 1 from walk_sessions
         where user_id = v_user_id and status = 'completed' and end_time::date = p_covered_date
    ) into v_has_walk;
    if v_has_walk then
        raise exception 'O gün zaten bir yürüyüşünüz var, kalkana gerek yok';
    end if;

    insert into streak_shield_uses (user_id, covered_date)
    values (v_user_id, p_covered_date)
    on conflict (user_id, covered_date) do nothing;

    update profiles
       set streak_shield_available = (v_used + 1) < v_limit,
           streak_shield_week_start = v_current_week
     where id = v_user_id;
    return true;
end;
$$;

-- Her ayın 1'i: aktif Prime üyelerine 500 PawCoin (aynı ay için tekrar verilmez)
create or replace function public.grant_prime_monthly_pawcoin() returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
    r record;
    v_ref text := 'prime-monthly-' || to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM');
    v_count int := 0;
begin
    for r in select id from profiles where prime_until > now() loop
        if not exists (select 1 from point_transactions where user_id = r.id and reference_id = v_ref) then
            perform award_pati_puan_internal(r.id, 500, 'Prime aylık PawCoin', 'other', v_ref);
            perform notify_user(r.id, 'system', 'Prime aylık PawCoin''in yüklendi', 'Prime üyeliğin için hesabına 500 PawCoin eklendi.', null, null);
            v_count := v_count + 1;
        end if;
    end loop;
    return v_count;
end;
$$;

revoke all on function public.grant_prime_monthly_pawcoin() from public, anon, authenticated;

select cron.schedule('prime-monthly-pawcoin', '0 4 1 * *', $cmd$ select public.grant_prime_monthly_pawcoin(); $cmd$);

-- Prime rozeti başkalarının profilinde de görünsün (bitiş tarihi değil, sadece aktif mi)
create or replace view public.profile_cards as
 SELECT p.id, p.username, p.full_name, p.avatar_url,
    COALESCE(b.cover_url, p.cover_url) AS cover_url,
    p.bio, p.role, p.account_status, p.created_at, p.last_seen_at, p.aura_settings, p.pet_name,
    p.default_allow_comments, p.default_comment_privacy,
    b.business_type, b.name AS business_name, b.approved AS business_approved,
    COALESCE(b.province, p.province) AS province, COALESCE(b.district, p.district) AS district,
    b.lat AS business_lat, b.lng AS business_lng, b.working_hours, b.website, b.gallery_urls, b.cancellation_notice_hours,
    CASE WHEN b.id IS NOT NULL THEN b.phone ELSE NULL::character varying END AS phone,
    CASE WHEN b.id IS NOT NULL THEN b.address ELSE NULL::text END AS address,
    COALESCE(p.prime_until > now(), false) AS is_prime
   FROM profiles p LEFT JOIN businesses b ON b.id = p.id;
