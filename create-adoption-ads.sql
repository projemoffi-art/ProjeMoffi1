-- =====================================================
-- MOFFI - Sahiplendirme İlanları Tablosu (GÜVENLI VERSİYON)
-- Supabase SQL Editor'de çalıştırın
-- Her satır bağımsız çalışır, hata vermez
-- =====================================================

-- 1. Tabloyu oluştur (zaten varsa atla)
CREATE TABLE IF NOT EXISTS adoption_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    age TEXT,
    description TEXT,
    image_url TEXT,
    author_name TEXT,
    author_avatar TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'adopted', 'removed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security aç
ALTER TABLE adoption_ads ENABLE ROW LEVEL SECURITY;

-- 3. RLS Politikaları (önce varsa sil, sonra ekle)
DROP POLICY IF EXISTS "Anyone can view active adoption ads" ON adoption_ads;
CREATE POLICY "Anyone can view active adoption ads"
    ON adoption_ads FOR SELECT
    USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated users can create adoption ads" ON adoption_ads;
CREATE POLICY "Authenticated users can create adoption ads"
    ON adoption_ads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own adoption ads" ON adoption_ads;
CREATE POLICY "Users can update own adoption ads"
    ON adoption_ads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own adoption ads" ON adoption_ads;
CREATE POLICY "Users can delete own adoption ads"
    ON adoption_ads FOR DELETE
    USING (auth.uid() = user_id);

-- 4. pet-images bucket oluştur (zaten varsa atla)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-images', 'pet-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Storage politikaları (önce varsa sil)
DROP POLICY IF EXISTS "Authenticated users can upload adoption images" ON storage.objects;
CREATE POLICY "Authenticated users can upload adoption images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'pet-images'
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Anyone can view pet images" ON storage.objects;
CREATE POLICY "Anyone can view pet images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pet-images');

DROP POLICY IF EXISTS "Users can delete own pet images" ON storage.objects;
CREATE POLICY "Users can delete own pet images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'pet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
