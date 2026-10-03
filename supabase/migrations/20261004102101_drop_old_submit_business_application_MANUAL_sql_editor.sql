-- SQL Editor'dan çalıştır (bağlayıcı DROP/DELETE'i reddediyor). İkisi de acil değil.
-- 1) Vergi levhasını denetlemeyen eski 12 parametreli sürüm (20261004102100'de kullanıcıya kapatıldı).
drop function if exists public.submit_business_application(uuid, text, text, text, text, text, text, text, text, text, double precision, double precision);

-- 2) Claude'un tarayıcı testinden kalan işletme kaydı (üyesi ve belgesi yok, "reddedildi" işaretli).
delete from public.businesses where id = '2e5a5898-348a-48e2-8a27-c9197d3a44d2' and name = 'Vergi Test Klinik';
