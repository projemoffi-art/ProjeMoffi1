-- ====================================================================
-- MOFFI HESAP MERKEZİ VE KURUMSAL DOĞRULAMA (KYB) ALTYAPISI
-- ====================================================================
-- Bu migration, profiles tablosunu genişleterek rol yönetimi, 
-- kurumsal kayıtlar, KYB doğrulama süreçleri ve kullanıcı ayarları için 
-- gerekli kolonları ekler ve yetkilendirmeleri tanımlar.

-- 1. PROFILES TABLOSUNA KOLONLARIN EKLENMESİ
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'business', 'admin')),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) CHECK (business_type IN ('petshop', 'vet', 'grooming', 'trainer', 'shelter')),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS business_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyb_status VARCHAR(50) DEFAULT 'pending' CHECK (kyb_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS kyb_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS iban VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. MEVCUT SATIRLAR İÇİN VARSAYILAN DEĞERLERİN GÜNCELLENMESİ
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
UPDATE public.profiles SET business_approved = false WHERE business_approved IS NULL;
UPDATE public.profiles SET kyb_status = 'pending' WHERE kyb_status IS NULL;
UPDATE public.profiles SET settings = '{}'::jsonb WHERE settings IS NULL;

-- 3. RLS POLİTİKALARININ GENİŞLETİLMESİ
-- Kullanıcıların kendi profillerini kurumsal kayıt bilgileriyle de güncelleyebilmesini sağlar.
-- (profiles tablosu için UPDATE ve INSERT yetkileri auth.uid() eşleşmesi ile zaten mevcuttur.)
-- Adminlerin tüm profilleri seçebilmesi/düzenleyebilmesi için ek poliçe (Opsiyonel - Postgres süper yetkili değilse bypass edilir)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
    CREATE POLICY "Admins can select all profiles" 
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );
EXCEPTION WHEN OTHERS THEN
    -- RLS yetkisi kısıtlıysa veya poliçe zaten varsa hata fırlatmadan geç
END;
$$;
