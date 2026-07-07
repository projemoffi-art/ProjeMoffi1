-- ====================================================================
-- PROFILES TABLOSU YETKİLENDİRME VE GÜVENLİK YAMASI
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. VERİTABANI DÜZEYİNDE ERİŞİM YETKİLERİ (GRANT)
-- Anonim ve Giriş yapmış (Authenticated) kullanıcılara profiles tablosu için tam yetki verelim.
-- (Böylece "permission denied for table profiles" hatası çözülür)
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;

-- 2. SATIR BAZLI GÜVENLİK (RLS) POLİTİKALARI
-- Eğer RLS aktifse, kullanıcıların kendi profillerini güncelleyebilmesi gerekir.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut update politikasını temizleyip yeniden oluşturalım
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles" 
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Kullanıcıların kendi profillerini insert etmesine de izin verelim (onboarding/provisioning için)
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" 
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- her kes okuyabilsin (SELECT)
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" 
ON public.profiles
FOR SELECT
TO public
USING (true);


-- ====================================================================
-- 3. STORAGE BUCKET VE ERİŞİM YETKİLERİ (AVATARS & POSTS)
-- ====================================================================
-- Bucket'lar zaten mevcut olduğundan oluşturma işlemini atlayıp sadece RLS yetkilerini kesinleştirelim.

-- Eski politikaları temizle
DROP POLICY IF EXISTS "Avatars insert policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatars select policy for public" ON storage.objects;
DROP POLICY IF EXISTS "Avatars update policy for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete policy for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatars update policy for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete policy for owner" ON storage.objects;
DROP POLICY IF EXISTS "Avatars update policy for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete policy for authenticated" ON storage.objects;

-- Giriş yapmış tüm kullanıcılar avatars bucket'ına dosya yükleyebilir (Klasör eşleşme hatasını önler)
CREATE POLICY "Avatars insert policy for authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Herkes avatar ve kapak resimlerini görebilir (Public CDN)
CREATE POLICY "Avatars select policy for public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Giriş yapmış kullanıcılar avatars bucket'ındaki dosyaları güncelleyebilir veya silebilir
CREATE POLICY "Avatars update policy for authenticated"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Avatars delete policy for authenticated"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

