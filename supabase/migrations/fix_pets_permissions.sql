-- ====================================================================
-- PETS VE WALK_SESSIONS TABLOLARI YETKİLENDİRME VE GÜVENLİK YAMASI
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. VERİTABANI DÜZEYİNDE ERİŞİM YETKİLERİ (GRANT)
-- Anonim ve Giriş yapmış (Authenticated) kullanıcılara pets ve walk_sessions tabloları için tam yetki verelim.
-- (Böylece "permission denied for table" hatası çözülür)

GRANT ALL ON TABLE public.pets TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.walk_sessions TO postgres, service_role, authenticated, anon;

-- Tabloların ID veya Sequence generator'ları varsa onlar için de yetki verelim:
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated, anon;


-- 2. SATIR BAZLI GÜVENLİK (RLS) POLİTİKALARI
-- Eğer bu tablolarda RLS aktifse, kullanıcıların kendi petlerini/yürüyüşlerini kaydedebilmesi ve görebilmesi gerekir.

-- A) RLS Politikalarını Temizleme ve Yeniden Oluşturma (pets tablosu için)
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can perform all actions on their own pets" ON public.pets;
CREATE POLICY "Users can perform all actions on their own pets" 
ON public.pets
FOR ALL 
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Anonim/Diğer kullanıcıların sahipli petleri okumasına veya kayıp ilanlarını görmesine izin verme (isteğe bağlı)
DROP POLICY IF EXISTS "Anyone can read pets" ON public.pets;
CREATE POLICY "Anyone can read pets" 
ON public.pets
FOR SELECT 
TO public
USING (true);


-- B) RLS Politikalarını Temizleme ve Yeniden Oluşturma (walk_sessions tablosu için)
ALTER TABLE public.walk_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can perform all actions on their own walk sessions" ON public.walk_sessions;
CREATE POLICY "Users can perform all actions on their own walk sessions" 
ON public.walk_sessions
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Anonim/Diğer kullanıcıların okumasına izin verme (isteğe bağlı)
DROP POLICY IF EXISTS "Anyone can read walk sessions" ON public.walk_sessions;
CREATE POLICY "Anyone can read walk sessions" 
ON public.walk_sessions
FOR SELECT 
TO public
USING (true);


-- C) EĞER TAMAMEN RLS'İ KAPATMAK VE HERKESE İZİN VERMEK İSTERSENİZ:
-- (Yukarıdaki politikalara rağmen sorun yaşarsanız aşağıdaki satırların başındaki yorumları kaldırıp çalıştırabilirsiniz)
-- ALTER TABLE public.pets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.walk_sessions DISABLE ROW LEVEL SECURITY;
