-- Genel kontrol (2026-10-03, üst kart işinden sonra) — Supabase güvenlik danışmanı bulguları.
-- 1) add_game_reward: istemci miktarı söylüyordu (çağrı başına 500), günlük sınır yalnızca tarayıcıdaydı → sonsuz döngüyle
--    oyun sıralaması (coin_balance) ve hayvan XP'si şişirilebiliyordu; girişsiz de çağrılabiliyordu. Artık günlük üst sınır
--    sunucuda (Türkiye günü): 100 oyun puanı + 500 XP; fazlası kırpılır. coin_balance satın alınan
--    PawCoin DEĞİL (o pati_puan_balance), yalnızca oyun sıralaması.
-- 2) Girişsiz (anon) çağrılabilen ve giriş gerektiren fonksiyonlar kapatıldı: verify_and_claim (girişsizken sahipsiz hayvan
--    oluşturuyordu), request_manual_claim, toggle_post_like, toggle_comment_like. get_user_comment_likes kullanılmıyor ve
--    başkasının beğenilerini döndürüyordu: kapatıldı.
-- 3) get_active_users_at_location (yönetici "Aktivite" sayfası): olmayan route sütununa bakıp hata yutarak hep 0 dönüyordu ve
--    her girişli kullanıcıya açıktı. Yalnızca yönetici; son noktası path_coordinates'te olan, son 2 saatte nokta gelen aktif yürüyüş.
-- 4) search_path sabitlenmemiş 16 fonksiyon sabitlendi (davranış değişmez).

create table if not exists public.game_reward_days (
    user_id uuid not null references auth.users(id) on delete cascade,
    day date not null,
    coins integer not null default 0,
    xp integer not null default 0,
    primary key (user_id, day)
);
alter table public.game_reward_days enable row level security;
revoke all on public.game_reward_days from anon, authenticated;

create or replace function public.add_game_reward(p_pet_id uuid, p_xp_earned integer, p_coins_earned integer)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid();
    v_day date := (now() at time zone 'Europe/Istanbul')::date;
    v_row public.game_reward_days;
    v_coins integer;
    v_xp integer;
begin
    if v_uid is null then raise exception 'Giriş gerekli' using errcode = '42501'; end if;
    if not exists (select 1 from public.pets where id = p_pet_id and owner_id = v_uid) then
        raise exception 'Bu evcil hayvan size ait değil' using errcode = '42501';
    end if;

    insert into public.game_reward_days (user_id, day) values (v_uid, v_day) on conflict do nothing;
    select * into v_row from public.game_reward_days where user_id = v_uid and day = v_day for update;

    v_coins := least(greatest(coalesce(p_coins_earned, 0), 0), greatest(100 - v_row.coins, 0));
    v_xp := least(greatest(coalesce(p_xp_earned, 0), 0), greatest(500 - v_row.xp, 0));

    update public.game_reward_days set coins = coins + v_coins, xp = xp + v_xp where user_id = v_uid and day = v_day;
    if v_xp > 0 then
        update public.pets set xp = coalesce(xp, 0) + v_xp, level = 1 + floor((coalesce(xp, 0) + v_xp) / 1000.0) where id = p_pet_id;
    end if;
    if v_coins > 0 then
        update public.profiles set coin_balance = coalesce(coin_balance, 0) + v_coins where id = v_uid;
    end if;
    -- Dönüş tipi eski imzayla aynı (boolean); kırpma sessizdir, oyun ekranı kendi gösterimini yapar.
    return v_coins > 0 or v_xp > 0;
end $$;
revoke execute on function public.add_game_reward(uuid, integer, integer) from public, anon;
grant execute on function public.add_game_reward(uuid, integer, integer) to authenticated;

revoke execute on function public.verify_and_claim(uuid, text) from public, anon;
grant execute on function public.verify_and_claim(uuid, text) to authenticated;
revoke execute on function public.request_manual_claim(uuid) from public, anon;
grant execute on function public.request_manual_claim(uuid) to authenticated;
revoke execute on function public.toggle_post_like(uuid) from public, anon;
grant execute on function public.toggle_post_like(uuid) to authenticated;
revoke execute on function public.toggle_comment_like(uuid) from public, anon;
grant execute on function public.toggle_comment_like(uuid) to authenticated;
revoke execute on function public.get_user_comment_likes(uuid, uuid[]) from public, anon, authenticated;

create or replace function public.get_active_users_at_location(loc_lat double precision, loc_lng double precision, radius_km double precision)
returns integer language plpgsql stable security definer set search_path to 'public' as $$
begin
    if not public.is_platform_admin() then raise exception 'Yetkisiz' using errcode = '42501'; end if;
    return (
        select count(*)::integer from public.walk_sessions w
         where w.status = 'active'
           and coalesce(w.last_point_at, w.start_time) > now() - interval '2 hours'
           and jsonb_typeof(w.path_coordinates) = 'array' and jsonb_array_length(w.path_coordinates) > 0
           and public.haversine_distance(loc_lat, loc_lng, (w.path_coordinates->-1->>'lat')::float, (w.path_coordinates->-1->>'lng')::float) <= radius_km
    );
end $$;
revoke execute on function public.get_active_users_at_location(double precision, double precision, double precision) from public, anon;
grant execute on function public.get_active_users_at_location(double precision, double precision, double precision) to authenticated;

do $$
declare r record;
begin
    for r in
        select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public'
           and p.proname in ('haversine_distance','protect_profile_fields','ai_limits','guard_profile_deletion','toggle_post_like',
                             'guard_profile_consent','guard_profile_prime','purge_deleted_user_data','toggle_comment_like',
                             'cleanup_lost_pet_conversations','protect_profile_security_fields','get_user_comment_likes','sync_likes_count',
                             'request_data_deletion')
           and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
    loop
        execute format('alter function %s set search_path to %L', r.sig, 'public');
    end loop;
end $$;
