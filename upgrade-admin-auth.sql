-- 1. Profiles tablosuna "role" sütunu ekle
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 2. Kendi hesabını ADMIN yap ve girişi aktifleştir
DO $$
DECLARE
    target_email TEXT := 'projemoffi@gmail.com';
    target_id UUID;
BEGIN
    -- Auth tablosundan ID'yi bul
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;
    
    IF target_id IS NOT NULL THEN
        -- Profile tablosunda rolü güncelle
        UPDATE public.profiles SET role = 'admin' WHERE id = target_id;
        
        -- Auth metadata'yı da güncelle
        UPDATE auth.users 
        SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
        WHERE id = target_id;
        
        -- Email onayını manuel olarak DOĞRULA (Giriş yapamama sorununu çözer)
        UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE id = target_id;
    END IF;
END $$;
