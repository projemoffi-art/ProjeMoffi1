-- Faz 0 (Kayıp · Sahiplendirme · Sosyal denetimi): kişisel veri gizliliği.
--   1) profiles herkese açıktı (telefon, adres, doğum tarihi, IBAN, vergi no, bakiyeler, ayarlar).
--      Artık: sahibi, yönetici, randevusu olan klinik (kendi müşterisi), sipariş alan satıcı (alıcısı).
--      Başkalarına gereken alanlar profile_cards görünümünden; işletmenin telefon/adresi herkese açık
--      (müşteri ulaşabilsin), bireysel kullanıcınınki asla.
--   2) Moffi Puanı ve seri kalkanı istemciden doğrudan değiştirilemez (sadece sunucu fonksiyonları).
--   3) Sahiplendirme ilanındaki telefon ve kayıp ilanının tam konumu herkese açık değil.

-- 1) Profiller -------------------------------------------------------------------------------
drop policy if exists "Herkes profilleri okuyabilir" on public.profiles;
drop policy if exists "moffi_profiles_read" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "Profiles: owner reads" on public.profiles;
drop policy if exists "Profiles: admin reads" on public.profiles;
drop policy if exists "Profiles: clinic reads its customers" on public.profiles;
drop policy if exists "Profiles: seller reads buyers" on public.profiles;

create policy "Profiles: owner reads" on public.profiles for select to authenticated
    using (id = auth.uid());
create policy "Profiles: admin reads" on public.profiles for select to authenticated
    using (public.get_my_role() = 'admin');
create policy "Profiles: clinic reads its customers" on public.profiles for select to authenticated
    using (exists (select 1 from public.appointments a where a.user_id = profiles.id and a.clinic_id = auth.uid()));
create policy "Profiles: seller reads buyers" on public.profiles for select to authenticated
    using (exists (select 1 from public.orders o where o.user_id = profiles.id and public.is_order_seller(o.id)));

revoke select on public.profiles from anon;

create or replace view public.profile_cards as
select p.id, p.username, p.full_name, p.avatar_url, p.cover_url, p.bio, p.role, p.account_status,
       p.created_at, p.last_seen_at, p.aura_settings, p.pet_name,
       p.default_allow_comments, p.default_comment_privacy,
       p.business_type, p.business_name, p.business_approved, p.province, p.district,
       p.business_lat, p.business_lng, p.working_hours, p.website, p.gallery_urls, p.cancellation_notice_hours,
       case when p.role = 'business' then p.phone end as phone,
       case when p.role = 'business' then p.address end as address
from public.profiles p;

revoke all on public.profile_cards from anon, authenticated;
grant select on public.profile_cards to anon, authenticated;

-- Yorum kuralları gönderi sahibinin gizli yasaklı kelime listesini okur: tanımlayanın yetkisiyle çalışır.
alter function public.enforce_comment_settings() security definer;
alter function public.enforce_comment_settings() set search_path = public;
revoke execute on function public.enforce_comment_settings() from public;

-- İşletmeler sekmesi (PawCoin sıralaması) ve "aynı şehir" filtresi bakiye/adres açmadan sunucuda.
create or replace function public.get_coin_leaderboard(p_role text, p_limit integer default 50)
returns table (id uuid, full_name text, avatar_url text, coin_balance numeric, pet_name text)
language sql stable security definer set search_path = public as $$
    select p.id, p.full_name, p.avatar_url, coalesce(p.coin_balance, 0)::numeric, p.pet_name
    from profiles p
    where p.role = p_role and coalesce(p.account_status, 'active') <> 'deactivated'
    order by p.coin_balance desc nulls last
    limit least(greatest(p_limit, 1), 100);
$$;
revoke execute on function public.get_coin_leaderboard(text, integer) from public;
grant execute on function public.get_coin_leaderboard(text, integer) to authenticated;

create or replace function public.get_my_coin_rank()
returns integer language sql stable security definer set search_path = public as $$
    select (count(*) + 1)::integer from profiles p
    where coalesce(p.coin_balance, 0) > (select coalesce(coin_balance, 0) from profiles where id = auth.uid());
$$;
revoke execute on function public.get_my_coin_rank() from public;
grant execute on function public.get_my_coin_rank() to authenticated;

create or replace function public.get_same_city_user_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
    select p.id from profiles p, profiles me
    where me.id = auth.uid() and coalesce(trim(me.address), '') <> ''
      and p.role = 'user' and p.address = me.address;
$$;
revoke execute on function public.get_same_city_user_ids() from public;
grant execute on function public.get_same_city_user_ids() to authenticated;

-- 2) Puan ve seri kalkanı sadece sunucu fonksiyonlarıyla değişir. Tetikleyici çağıranın haklarıyla
-- çalışır: istemcinin doğrudan güncellemesinde current_user = authenticated; award_pati_puan,
-- use_streak_shield gibi SECURITY DEFINER fonksiyonların içinde current_user = fonksiyon sahibi.
create or replace function public.guard_profile_rewards()
returns trigger language plpgsql set search_path = public as $$
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'INSERT' then
            new.pati_puan_balance := 0;
            new.streak_shield_available := true;
            new.streak_shield_week_start := null;
        else
            new.pati_puan_balance := old.pati_puan_balance;
            new.streak_shield_available := old.streak_shield_available;
            new.streak_shield_week_start := old.streak_shield_week_start;
        end if;
    end if;
    return new;
end;
$$;
drop trigger if exists guard_profile_rewards on public.profiles;
create trigger guard_profile_rewards before insert or update on public.profiles
for each row execute function public.guard_profile_rewards();

-- 3) İlanlar ------------------------------------------------------------------------------------
-- Sahiplendirme: telefon herkese açık okunmaz (iletişim uygulama içi mesajla). Kolon düzeyinde yetki.
revoke select on public.adoption_pets from anon, authenticated;
grant select (id, user_id, pet_name, img_url, location_text, owner_name, description, pet_type, pet_breed,
              pet_age, status, created_at, moderation_result, moderation_passed, moderated_at, images, gender)
    on public.adoption_pets to anon, authenticated;

-- Kayıp: tam koordinat sadece ilan sahibine; herkese ~300 m'lik ızgaraya yuvarlanmış konum.
revoke select on public.lost_pets from anon, authenticated;
grant select (id, user_id, pet_name, img_url, location_text, last_seen_date, reward_enabled, reward_amount,
              description, pet_type, status, created_at, pet_id, images)
    on public.lost_pets to anon, authenticated;

create or replace view public.lost_pet_cards as
select l.id, l.user_id, l.pet_name, l.img_url, l.images, l.location_text, l.last_seen_date,
       l.reward_enabled, l.reward_amount, l.description, l.pet_type, l.status, l.created_at, l.pet_id,
       case when l.user_id = auth.uid() then l.latitude else round((l.latitude / 0.003)::numeric) * 0.003 end as latitude,
       case when l.user_id = auth.uid() then l.longitude else round((l.longitude / 0.003)::numeric) * 0.003 end as longitude,
       l.user_id = auth.uid() as is_mine
from public.lost_pets l;
revoke all on public.lost_pet_cards from anon, authenticated;
grant select on public.lost_pet_cards to anon, authenticated;
