-- ====================================================================
-- TEMİZ VE GÜVENLİ PROFILES TABLOSU RLS & GRANT YAPILANDIRMASI
-- (Eski dağınık fix_*.sql dosyalarının yerine geçer)
-- ====================================================================

-- 1. ESKİ YANLIŞ VE FAZLA YETKİLERİ TEMİZLEME
-- anon kullanıcısının insert/update/delete yapabilme ihtimalini (GRANT ALL) kaldırıyoruz.
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;

-- 2. DOĞRU VERİTABANI DÜZEYİNDE (GRANT) YETKİLENDİRME
-- anon sadece SELECT yapabilir. authenticated kullanıcılar kendi profillerini yönetebileceği için CRUD yetkileri verilir.
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

-- (Not: Service_role ve postgres her zaman tam yetkiye sahip olmalıdır)
GRANT ALL ON TABLE public.profiles TO postgres, service_role;

-- 3. RLS'Yİ (ROW LEVEL SECURITY) AKTİF ETME VE SIFIRLAMA
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut tüm profiles politikalarını temizlemek için dinamik sorgu
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END
$$;

-- 4. YENİ VE TEMİZ RLS POLİTİKALARI

-- Herkes profilleri okuyabilir (Sadece Public Data)
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
TO public 
USING (true);

-- Sadece giriş yapmış kullanıcı kendi ID'si ile profil oluşturabilir (Onboarding)
CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Kullanıcı sadece kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Kullanıcı profilini silmek isterse sadece kendisininkini silebilir
CREATE POLICY "profiles_delete_policy" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

-- 5. AYRICALIK YÜKSELTME (PRIVILEGE ESCALATION) KORUMASI
-- Normal kullanıcıların kendilerini admin/business yapmalarını veya premium onaylarını değiştirmelerini engeller.
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger AS $$
BEGIN
  -- Sadece standart (authenticated) kullanıcılar için kısıtlama yapıyoruz.
  -- postgres veya service_role bu kısıtlamalara takılmaz.
  IF auth.role() = 'authenticated' THEN
    
    IF TG_OP = 'INSERT' THEN
      -- Yeni kayıt oluşturulurken dışarıdan ne gönderilirse gönderilsin varsayılanlara zorla
      NEW.role = 'user';
      NEW.is_premium = false;
      NEW.business_approved = false;
      NEW.kyb_status = 'pending';
      NEW.account_status = 'active';
      
    ELSIF TG_OP = 'UPDATE' THEN
      -- Güncelleme yapılırken bu hassas alanların değişmesine izin verme (eski değeri koru)
      NEW.role = OLD.role;
      NEW.is_premium = OLD.is_premium;
      NEW.business_approved = OLD.business_approved;
      NEW.kyb_status = OLD.kyb_status;
      NEW.account_status = OLD.account_status;
      NEW.business_type = OLD.business_type;
      -- FİNANSAL GÜVENLİK: Kullanıcılar kendi bakiyelerini doğrudan değiştiremez
      NEW.wallet_balance = OLD.wallet_balance;
      NEW.coin_balance = OLD.coin_balance;
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_profile_security_unchanged ON public.profiles;
CREATE TRIGGER ensure_profile_security_unchanged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_security_fields();

