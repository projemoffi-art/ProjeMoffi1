-- ====================================================================
-- MOFFI STORAGE BUCKETS VE RLS POLİTİKALARI YAMASI
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin,
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. BUCKETLARIN OLUŞTURULMASI
-- (posts, stories, avatars, sounds bucket'larının varlığından emin oluyoruz)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('sounds', 'sounds', true)
ON CONFLICT (id) DO NOTHING;

-- 2. ESKİ STORAGE POLİTİKALARININ TEMİZLENMESİ
-- Çakışmaları önlemek için eski politikaları kaldırıyoruz.
DROP POLICY IF EXISTS "Avatars insert policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatars select policy for public" ON storage.objects;
DROP POLICY IF EXISTS "Avatars update policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete policy for authenticated" ON storage.objects;

DROP POLICY IF EXISTS "Posts insert policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Posts select policy for public" ON storage.objects;
DROP POLICY IF EXISTS "Posts update policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Posts delete policy for authenticated" ON storage.objects;

DROP POLICY IF EXISTS "Stories insert policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Stories select policy for public" ON storage.objects;
DROP POLICY IF EXISTS "Stories update policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Stories delete policy for authenticated" ON storage.objects;

DROP POLICY IF EXISTS "Sounds insert policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Sounds select policy for public" ON storage.objects;
DROP POLICY IF EXISTS "Sounds update policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Sounds delete policy for authenticated" ON storage.objects;

-- 3. YENİ RLS POLİTİKALARININ OLUŞTURULMASI

-- A) GÖRSEL VE MEDYA OKUMA POLİTİKASI (HERKESE AÇIK CDN)
CREATE POLICY "Public select policy for storage"
ON storage.objects FOR SELECT TO public
USING (bucket_id IN ('avatars', 'posts', 'stories', 'sounds'));

-- B) MEDYA YÜKLEME POLİTİKASI (GİRİŞ YAPMIŞ KULLANICILAR)
CREATE POLICY "Authenticated insert policy for storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('avatars', 'posts', 'stories', 'sounds'));

-- C) MEDYA GÜNCELLEME POLİTİKASI (GİRİŞ YAPMIŞ KULLANICILAR)
CREATE POLICY "Authenticated update policy for storage"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('avatars', 'posts', 'stories', 'sounds'));

-- D) MEDYA SİLME POLİTİKASI (GİRİŞ YAPMIŞ KULLANICILAR)
CREATE POLICY "Authenticated delete policy for storage"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('avatars', 'posts', 'stories', 'sounds'));
