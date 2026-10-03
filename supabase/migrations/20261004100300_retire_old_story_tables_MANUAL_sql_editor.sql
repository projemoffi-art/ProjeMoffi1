-- Eski hikâye tabloları (2026-10-04): İçerik Stüdyosu (content_items) yerine geçti, kodda hiçbir kullanımı kalmadı.
-- Hepsi boş (2026-10-04 sayımı: 0 satır). Baran SQL Editor'dan çalıştırır (bağlayıcı DROP içeren komutu uygulayamıyor).
--   system_announcements → content_items (channel 'moffi')
--   vet_advices          → content_items (channel 'vet', onaylı)
--   business_deals       → clinic_campaigns + content_items (channel 'deal', onaylı)
--   deal_analytics       → business_deals'a bağlı sayaç tablosu; yerine content_events
--   deals-media deposu   → kodda kullanılmıyor (0 dosya); yükleme izni kaldırılır
-- Güvenlik için önce boş olduklarını doğrular; doluysa hiçbir şey yapmadan durur.

do $$
begin
    if (select count(*) from public.system_announcements) > 0
       or (select count(*) from public.vet_advices) > 0
       or (select count(*) from public.business_deals) > 0
       or (select count(*) from public.deal_analytics) > 0 then
        raise exception 'Tablolardan biri boş değil; önce içeriği İçerik Stüdyosuna taşıyın.';
    end if;
end $$;

-- Yalnızca silinen /api/deals/track tarafından kullanılan sayaç fonksiyonu
drop function if exists public.increment_deal_uses;

drop table if exists public.deal_analytics;
drop table if exists public.system_announcements;
drop table if exists public.vet_advices;
drop table if exists public.business_deals;

drop policy if exists "Sadece giris yapanlar deals-media yukleyebilir" on storage.objects;
