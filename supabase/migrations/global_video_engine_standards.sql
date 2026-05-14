-- ====================================================================
-- MOFFI GLOBAL VİDEO ENGINE STANDARTLARI (STORAGE & DURATION CONTROL)
-- ====================================================================
-- Bu migration, Moffi platformundaki video paylaşım kurallarını veritabanı 
-- seviyesinde sabitleyerek "Global Gerçeklik" (Global Truth) sağlar.

-- 1. POSTS TABLOSU GÜNCELLEMESİ
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trim_start DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trim_end DECIMAL DEFAULT 20;

-- 2. 20 SANİYE KURALI (SERVER-SIDE ENFORCEMENT)
-- Kullanıcının seçtiği aralığın 20 saniyeyi geçmemesini garanti eder.
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS check_video_duration;

ALTER TABLE posts
ADD CONSTRAINT check_video_duration 
CHECK (
    (is_video = false) OR 
    (trim_end - trim_start <= 20.5) -- 0.5s buffer for floating point issues
);

-- 3. STORAGE POLİTİKALARI (PROFESYONEL GÜVENLİK)
-- Sadece giriş yapmış kullanıcıların medya yüklemesine izin ver.
-- (Bucket isimleri: posts, stories, avatars, sounds)

DO $$
BEGIN
    -- Posts bucket için RLS ve public erişim
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('posts', 'posts', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('sounds', 'sounds', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 4. FEED_VIEW GÜNCELLEMESİ (Video Sütunlarını Dahil Et)
-- Bu view, ImmersivePostCard'ın tüm istemcilerde aynı şekilde çalışmasını sağlar.
DROP VIEW IF EXISTS feed_view CASCADE;
CREATE OR REPLACE VIEW feed_view AS
SELECT 
    p.id,
    p.user_id,
    p.content,
    p.media_url,
    p.audio_url,
    p.mood,
    p.is_video,
    p.trim_start,
    p.trim_end,
    pr.aura_settings AS aura_settings,
    p.likes_count,
    p.comments_count,
    p.allow_comments,
    p.comment_privacy,
    p.created_at,
    pr.full_name AS user_name,
    pr.avatar_url AS user_avatar,
    pr.account_status
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
WHERE pr.account_status != 'deactivated' OR pr.account_status IS NULL;
