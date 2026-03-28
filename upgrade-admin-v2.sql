-- 1. Profiles tablosuna "role" sütunu ekle (Eğer yoksa)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 2. Kendi hesabını ADMIN yap ve onay süreçlerini tamamla
DO $$
DECLARE
    target_email TEXT := 'projemoffi@gmail.com';
    target_id UUID;
BEGIN
    -- Auth tablosundan kullanıcının ID'sini bul
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;
    
    IF target_id IS NOT NULL THEN
        -- Profile tablosunda rolü güncelle
        UPDATE public.profiles SET role = 'admin' WHERE id = target_id;
        
        -- Auth metadata'yı da güncelle (Uygulama içi hızlı kontrol için)
        UPDATE auth.users 
        SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
        WHERE id = target_id;
        
        -- Email onayını manuel olarak DOĞRULA 
        -- Not: confirmed_at generated column olduğu için sadece email_confirmed_at'i güncelliyoruz
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = target_id;
        
        RAISE NOTICE 'Kullanıcı % başarıyla ADMIN yapıldı ve onaylandı.', target_email;
    ELSE
        RAISE NOTICE 'Kullanıcı % bulunamadı! Lütfen önce uygulamadan kayıt olun.', target_email;
    END IF;
END $$;
