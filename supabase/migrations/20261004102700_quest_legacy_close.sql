-- Görev Merkezi v2'ye geçiş: eski yollar kapatılır.
-- 1) claim_reward: istemcinin ödül anahtarını kendisinin istemesi (görev yapılmadan günde 200 PawCoin alınabiliyordu).
--    Yeni sistemde ödülü yalnızca sunucu verir (quest_grant). Fonksiyon ve reward_rules geçmiş kayıtlar için durur; istemciye kapalı.
revoke execute on function public.claim_reward(text) from public, anon, authenticated;

-- 2) Oyun XP'si günde 100 (Baran kararı 2026-10-03: görevlerin önüne geçmesin); seviye yeni eğriden (pet_level_for_xp).
create or replace function public.add_game_reward(p_pet_id uuid, p_xp_earned integer, p_coins_earned integer)
 returns boolean language plpgsql security definer set search_path to 'public' as $function$
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
    v_xp := least(greatest(coalesce(p_xp_earned, 0), 0), greatest(100 - v_row.xp, 0));

    update public.game_reward_days set coins = coins + v_coins, xp = xp + v_xp where user_id = v_uid and day = v_day;
    if v_xp > 0 then
        update public.pets set xp = coalesce(xp, 0) + v_xp, level = public.pet_level_for_xp(coalesce(xp, 0) + v_xp) where id = p_pet_id;
    end if;
    if v_coins > 0 then
        update public.profiles set coin_balance = coalesce(coin_balance, 0) + v_coins where id = v_uid;
    end if;
    return v_coins > 0 or v_xp > 0;
end $function$;

create or replace function public.game_status(p_pet_id uuid default null)
 returns json language plpgsql stable security definer set search_path to 'public' as $function$
declare
    v_uid uuid := auth.uid();
    v_day date := (now() at time zone 'Europe/Istanbul')::date;
    v_days public.game_reward_days;
    v_pet public.pets;
begin
    if v_uid is null then raise exception 'Giriş gerekli' using errcode = '42501'; end if;
    select * into v_days from public.game_reward_days where user_id = v_uid and day = v_day;
    if p_pet_id is not null then
        select * into v_pet from public.pets where id = p_pet_id and owner_id = v_uid;
    end if;
    return json_build_object(
        'coin_balance', (select coalesce(coin_balance, 0) from public.profiles where id = v_uid),
        'coins_today', coalesce(v_days.coins, 0),
        'xp_today', coalesce(v_days.xp, 0),
        'coin_cap', 100,
        'xp_cap', 100,
        'pet_xp', coalesce(v_pet.xp, 0),
        'pet_level', public.pet_level_for_xp(coalesce(v_pet.xp, 0))
    );
end $function$;
