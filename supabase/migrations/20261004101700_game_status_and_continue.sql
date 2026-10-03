-- Oyun ekranı gerçek değerleri gösterir (2026-10-04).
-- Eskiden: cüzdan "totalPatiPuan || 2450" ile başlıyordu, günlük kalan ödül 20'den sayılıyordu, kazanılan oyun altını
-- PawCoin göstergesine ekleniyordu (sunucu ise profiles.coin_balance'a yazıyor) ve hafıza oyunundaki "50 altın öde, devam et"
-- yalnızca ekranda düşüyordu. Bu iki fonksiyonla ekran sunucudaki durumu okur ve harcama sunucuda olur.

-- Bugünkü oyun ödülü durumu + oyun altını + seçili hayvanın XP/seviyesi (add_game_reward ile aynı gün ve sınırlar).
create or replace function public.game_status(p_pet_id uuid default null)
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $$
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
        'xp_cap', 500,
        'pet_xp', coalesce(v_pet.xp, 0),
        'pet_level', coalesce(v_pet.level, 1)
    );
end $$;

revoke execute on function public.game_status(uuid) from public, anon;
grant execute on function public.game_status(uuid) to authenticated;

-- Hafıza oyununda süre uzatma: fiyat sunucuda (50 oyun altını), istemci miktar söylemez. Yeni bakiyeyi döner.
create or replace function public.game_continue()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_uid uuid := auth.uid();
    v_balance integer;
begin
    if v_uid is null then raise exception 'Giriş gerekli' using errcode = '42501'; end if;
    update public.profiles set coin_balance = coin_balance - 50
     where id = v_uid and coalesce(coin_balance, 0) >= 50
     returning coin_balance into v_balance;
    if not found then raise exception 'Yeterli oyun altının yok' using errcode = 'P0001'; end if;
    return v_balance;
end $$;

revoke execute on function public.game_continue() from public, anon;
grant execute on function public.game_continue() to authenticated;
