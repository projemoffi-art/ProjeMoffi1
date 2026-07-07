-- ====================================================================
-- LOST_PETS VE ADOPTION_PETS TABLOLARI YETKİLENDİRME VE GÜVENLİK YAMASI
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 0. TABLO KOLON DÜZENLEMELERİ (lost_pets tablosu için koordinatlar ve pet ilişkisi)
ALTER TABLE public.lost_pets ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.lost_pets ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.lost_pets ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE;

-- 1. VERİTABANI DÜZEYİNDE ERİŞİM YETKİLERİ (GRANT)
-- Anonim ve Giriş yapmış (Authenticated) kullanıcılara tablolar için tam yetki verelim.
-- (Böylece "permission denied for table" hatası çözülür)

GRANT ALL ON TABLE public.lost_pets TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.adoption_pets TO postgres, service_role, authenticated, anon;

-- Sequence generator'ları varsa onlar için de yetki verelim:
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;


-- 2. SATIR BAZLI GÜVENLİK (RLS) POLİTİKALARI (lost_pets tablosu)
ALTER TABLE public.lost_pets ENABLE ROW LEVEL SECURITY;

-- A) Okuma izni (Herkes görebilmeli)
DROP POLICY IF EXISTS "Allow public read access for lost_pets" ON public.lost_pets;
CREATE POLICY "Allow public read access for lost_pets" 
ON public.lost_pets FOR SELECT 
TO public
USING (true);

-- B) Ekleme izni (Sadece giriş yapmış kullanıcılar kendi adlarına ekleyebilir)
DROP POLICY IF EXISTS "Allow insert for authenticated users for lost_pets" ON public.lost_pets;
CREATE POLICY "Allow insert for authenticated users for lost_pets" 
ON public.lost_pets FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- C) Düzenleme/Silme izni (Sadece ilanın sahibi yapabilir)
DROP POLICY IF EXISTS "Allow update/delete for owners for lost_pets" ON public.lost_pets;
CREATE POLICY "Allow update/delete for owners for lost_pets" 
ON public.lost_pets FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 3. SATIR BAZLI GÜVENLİK (RLS) POLİTİKALARI (adoption_pets tablosu)
ALTER TABLE public.adoption_pets ENABLE ROW LEVEL SECURITY;

-- A) Okuma izni (Herkes görebilmeli)
DROP POLICY IF EXISTS "Allow public read access for adoption_pets" ON public.adoption_pets;
CREATE POLICY "Allow public read access for adoption_pets" 
ON public.adoption_pets FOR SELECT 
TO public
USING (true);

-- B) Ekleme izni (Sadece giriş yapmış kullanıcılar kendi adlarına ekleyebilir)
DROP POLICY IF EXISTS "Allow insert for authenticated users for adoption_pets" ON public.adoption_pets;
CREATE POLICY "Allow insert for authenticated users for adoption_pets" 
ON public.adoption_pets FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- C) Düzenleme/Silme izni (Sadece ilanın sahibi yapabilir)
DROP POLICY IF EXISTS "Allow update/delete for owners for adoption_pets" ON public.adoption_pets;
CREATE POLICY "Allow update/delete for owners for adoption_pets" 
ON public.adoption_pets FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 4. PET_SIGHTINGS (GÖRÜLME İHBARLARI) TABLOSU VE İZİNLERİ
CREATE TABLE IF NOT EXISTS public.pet_sightings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lost_pet_id UUID REFERENCES public.lost_pets(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    img_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration column for existing databases
ALTER TABLE public.pet_sightings ADD COLUMN IF NOT EXISTS img_url TEXT;

-- Tablo Yetkilendirmeleri
GRANT ALL ON TABLE public.pet_sightings TO postgres, service_role, authenticated, anon;

-- RLS Aktifleştirme
ALTER TABLE public.pet_sightings ENABLE ROW LEVEL SECURITY;

-- A) Okuma izni (Herkes görebilmeli)
DROP POLICY IF EXISTS "Allow public read access for pet_sightings" ON public.pet_sightings;
CREATE POLICY "Allow public read access for pet_sightings" 
ON public.pet_sightings FOR SELECT 
TO public
USING (true);

-- B) Ekleme izni (Sadece giriş yapmış kullanıcılar kendi adlarına ekleyebilir)
DROP POLICY IF EXISTS "Allow insert for authenticated users for pet_sightings" ON public.pet_sightings;
CREATE POLICY "Allow insert for authenticated users for pet_sightings" 
ON public.pet_sightings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- 5. REALTIME (ANLIK GÜNCELLEME) YAYINI
-- lost_pets tablosunun anlık veri yayını yapabilmesi için Supabase SQL Editor'de aşağıdaki satırın çalıştırılması önerilir:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.lost_pets;

-- 6. SOHBET VE MESAJLAŞMA SİSTEMİ ERİŞİM YETKİLERİ (GRANT)
-- Mesajlaşma esnasında "permission denied for table conversations" hatasını çözmek için:
GRANT ALL ON TABLE public.conversations TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.messages TO postgres, service_role, authenticated, anon;
