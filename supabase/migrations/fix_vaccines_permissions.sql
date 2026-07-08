-- ====================================================================
-- VACCINES TABLOSU YETKİLENDİRME VE GÜVENLİK YAMASI
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. VERİTABANI DÜZEYİNDE ERİŞİM YETKİLERİ (GRANT)
-- Anonim ve Giriş yapmış (Authenticated) kullanıcılara vaccines tablosu için tam yetki verelim.
-- (Böylece "permission denied for table vaccines" hatası çözülür)

GRANT ALL ON TABLE public.vaccines TO postgres, service_role, authenticated, anon;

-- Tablonun ID veya Sequence generator'ları varsa onlar için de yetki verelim:
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;


-- 2. SATIR BAZLI GÜVENLİK (RLS) POLİTİKALARI
-- Eğer vaccines tablosunda RLS aktifse, kullanıcıların aşı kayıtlarını görebilmesi
-- ve kendi petlerine ait aşı kayıtlarını ekleyip düzenleyebilmesi gerekir.

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

-- A) Aşı Kayıtlarını Okuma Politikası
-- Sadece giriş yapmış olan kullanıcılar, kendi sahibi oldukları petlere ait aşı kayıtlarını okuyabilir.
DROP POLICY IF EXISTS "Anyone can read vaccines" ON public.vaccines;
DROP POLICY IF EXISTS "Owners can read their pets vaccines" ON public.vaccines;
CREATE POLICY "Owners can read their pets vaccines" 
ON public.vaccines
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pets 
        WHERE pets.id = vaccines.pet_id 
        AND pets.owner_id = auth.uid()
    )
);

-- B) Aşı Kayıtlarını Yönetme Politikası (INSERT, UPDATE, DELETE)
-- Giriş yapmış kullanıcılar sadece kendi sahibi oldukları petlere ait aşı kayıtlarını yönetebilir.
-- pets tablosundaki owner_id ile auth.uid() eşleştirilir.
DROP POLICY IF EXISTS "Owners can manage their pets vaccines" ON public.vaccines;
CREATE POLICY "Owners can manage their pets vaccines" 
ON public.vaccines
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pets 
        WHERE pets.id = vaccines.pet_id 
        AND pets.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pets 
        WHERE pets.id = vaccines.pet_id 
        AND pets.owner_id = auth.uid()
    )
);

-- C) EĞER TAMAMEN RLS'İ KAPATMAK VE HERKESE İZİN VERMEK İSTERSENİZ:
-- (Yukarıdaki politikalara rağmen aşı ekleme/güncellemede sorun yaşarsanız aşağıdaki satırın başındaki yorumu kaldırıp çalıştırabilirsiniz)
-- ALTER TABLE public.vaccines DISABLE ROW LEVEL SECURITY;
