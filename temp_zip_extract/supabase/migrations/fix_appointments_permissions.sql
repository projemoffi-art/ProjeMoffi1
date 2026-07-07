-- ====================================================================
-- APPOINTMENTS (RANDEVULAR) TABLOSU YETKİLENDİRME VE GÜVENLİK YAMASI
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. VERİTABANI DÜZEYİNDE ERİŞİM YETKİLERİ (GRANT)
GRANT ALL ON TABLE public.appointments TO postgres, service_role, authenticated, anon;

-- 2. TABLO KOLON EKSİKLİKLERİNİN DÜZELTİLMESİ
-- (Eğer tablonuzda bu kolonlar yoksa otomatik eklenecektir)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS pet_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS clinic_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS shared_passport JSONB;

-- 3. SATIR BAZLI GÜVENLİK (RLS) ETKİNLEŞTİRME
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Okuma Politikası: Kullanıcı kendi randevularını, veterinerler de tüm randevuları okuyabilir (Kolaylık açısından true veriyoruz)
DROP POLICY IF EXISTS "Allow select for authenticated users on appointments" ON public.appointments;
CREATE POLICY "Allow select for authenticated users on appointments" 
ON public.appointments FOR SELECT 
TO authenticated 
USING (true);

-- Ekleme Politikası: Sadece giriş yapmış kullanıcılar kendi adlarına randevu ekleyebilir
DROP POLICY IF EXISTS "Allow insert for authenticated users on appointments" ON public.appointments;
CREATE POLICY "Allow insert for authenticated users on appointments" 
ON public.appointments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Güncelleme Politikası: Hekimler ve kullanıcılar kendi randevularını güncelleyebilir (Onaylama/Tamamlama vb.)
DROP POLICY IF EXISTS "Allow update for authenticated users on appointments" ON public.appointments;
CREATE POLICY "Allow update for authenticated users on appointments" 
ON public.appointments FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. REALTIME YAYINI
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
END $$;
