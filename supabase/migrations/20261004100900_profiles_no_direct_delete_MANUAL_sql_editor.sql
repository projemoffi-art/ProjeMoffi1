-- Profil satırını istemciden doğrudan silme izni kaldırılır (2026-10-03 genel kontrol). Hesap silmenin tek yolu 30 günlük süreç:
-- kullanıcı request_account_deletion, yönetici admin_schedule_account_deletion; kalıcı silmeyi gece cron'u yapar (8.57).
-- Eski kural yöneticiye ve kişinin kendisine profil satırını silme izni veriyordu (hesap kalır, profil kaybolur).
-- Kullanılmayan "Moffi Studio" tablosu da kaldırılır (sayfası silindi, 4 örnek satır).
-- Baran SQL Editor'dan çalıştırır (bağlayıcı DROP/DELETE geçen komutu uygulayamıyor).

-- Ayrıca işletme kaydı uçtan uca testinden kalan "[TEST]" işletmeleri (sahipleri silindi; şu an onaysız/reddedilmiş, görünmüyorlar).

begin;
drop policy if exists "moffi_profiles_delete" on public.profiles;
revoke delete on public.profiles from authenticated, anon;
drop table if exists public.studio_assets;
delete from public.businesses where name like '[TEST]%' and approved = false;
commit;
