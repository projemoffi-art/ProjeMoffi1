-- Profil koruma tetikleyicileri tek desene (2026-10-03 genel kontrol). Eski iki tetikleyici auth.role() (JWT) bakıyordu; JWT sunucu
-- fonksiyonunun içinde de 'authenticated' kaldığı için yetkili SECURITY DEFINER fonksiyonların yaptığı değişiklikleri de sessizce geri
-- alıyordu (ör. add_game_reward'ın oyun puanı hiç yazılmadı). protect_profile_fields ayrıca kendisi SECURITY DEFINER'dı.
-- Yeni hâl guard_profile_rewards/consent/prime ile aynı: istemci doğrudan yazarsa (current_user authenticated/anon) korunan alanlar
-- eski değerinde kalır; sunucu fonksiyonları (sahibi postgres) yazabilir. Korunan alanlar değişmedi.

create or replace function public.protect_profile_fields()
returns trigger language plpgsql security invoker set search_path to 'public' as $$
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'UPDATE' then
            new.role := old.role;
            new.kyb_status := old.kyb_status;
            new.business_approved := old.business_approved;
        elsif tg_op = 'INSERT' then
            new.role := 'user';
            new.kyb_status := 'none';
            new.business_approved := false;
        end if;
    end if;
    return new;
end $$;

create or replace function public.protect_profile_security_fields()
returns trigger language plpgsql security invoker set search_path to 'public' as $$
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'INSERT' then
            new.role := 'user';
            new.business_approved := false;
            new.kyb_status := 'pending';
            new.account_status := 'active';
        elsif tg_op = 'UPDATE' then
            new.role := old.role;
            new.business_approved := old.business_approved;
            new.kyb_status := old.kyb_status;
            new.account_status := old.account_status;
            new.business_type := old.business_type;
            new.wallet_balance := old.wallet_balance;
            new.coin_balance := old.coin_balance;
        end if;
    end if;
    return new;
end $$;
