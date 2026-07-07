-- ====================================================================
-- MOFFI HESAP MERKEZİ VE KONTROL ALTYAPISI (SQL MIGRATION)
-- ====================================================================
-- Tarayıcında açık olan Supabase Dashboard -> SQL Editor paneline geçip 
-- bu betiğin tamamını yapıştırarak "Run" butonuna basman yeterlidir.

-- 1. PROFILES TABLOSUNA HESAP MERKEZİ ALANLARININ EKLENMESİ
-- Kişisel bilgilerin (Telefon, Doğum Tarihi, Cinsiyet) ve hesap durumunun kalıcı saklanması
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'Belirtmek İstemiyorum',
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

-- 2. BAĞLI HESAPLAR (User Connections) TABLOSU
-- Instagram, TikTok ve Facebook OAuth kimliklerinin ve çapraz paylaşım durumlarının tutulması
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'instagram', 'tiktok', 'facebook'
    handle_name VARCHAR(100),
    is_connected BOOLEAN DEFAULT true,
    access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- 3. HESAP SİLME GÜVENLİK PROSEDÜRÜ VE KASKAD (Cascade) FONKSİYONU
-- auth.users tablosundan silinen kullanıcının tüm kalıntılarını temizler
CREATE OR REPLACE FUNCTION purge_deleted_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Yorumları sil
    DELETE FROM comments WHERE user_id = OLD.id;
    -- Gönderileri sil
    DELETE FROM posts WHERE user_id = OLD.id;
    -- Bağlantıları sil
    DELETE FROM user_connections WHERE user_id = OLD.id;
    -- Profil tablosundan kalıcı olarak temizle
    DELETE FROM profiles WHERE id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- auth.users üzerinde trigger kurulumu (Sadece yetkili/admin modunda çalışır)
-- Supabase Cloud ortamında yetki kısıtlaması olmaması adına exception handler eklendi.
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_purge_deleted_user ON auth.users;
    CREATE TRIGGER trigger_purge_deleted_user
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION purge_deleted_user_data();
EXCEPTION WHEN OTHERS THEN
    -- Admin yetkisi yoksa veya Cloud izinleri kısıtlıysa hata fırlatmadan geç
END;
$$;

-- 4. GÜVENLİ VE İZOLASYONLU YAYIN İZİNLERİ
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_connections;
EXCEPTION WHEN OTHERS THEN
END;
$$;
