-- ====================================================================
-- MOFFI GLOBAL YORUM VE GİZLİLİK SİSTEMİ ALTYAPISI (SQL MIGRATION)
-- ====================================================================
-- Bu SQL betiğini Supabase Dashboard -> SQL Editor ekranına yapıştırıp
-- doğrudan çalıştırarak global altyapıyı anında devreye alabilirsiniz.

-- 1. POSTS TABLOSU GÜNCELLEMESİ (Gönderi Bazlı Geçersiz Kılma)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comment_privacy TEXT DEFAULT 'everyone';

-- 2. PROFILES TABLOSU GÜNCELLEMESİ (Genel Hesap Varsayılanları)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS default_allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_comment_privacy TEXT DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS comment_filter_words TEXT[] DEFAULT '{}'::TEXT[];

-- 3. COMMENTS TABLOSU GÜNCELLEMESİ (Moderasyon ve Spam Filtresi)
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 4. FEED_VIEW GÜNCELLEMESİ (Yeni Sütunların Akışa Yansıması)
DROP VIEW IF EXISTS feed_view CASCADE;
CREATE OR REPLACE VIEW feed_view AS
SELECT 
    p.id,
    p.user_id,
    p.content,
    p.media_url,
    p.audio_url,
    p.mood,
    p.aura_settings,
    p.likes_count,
    p.comments_count,
    p.allow_comments,
    p.comment_privacy,
    p.created_at,
    pr.full_name AS user_name,
    pr.avatar_url AS user_avatar
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id;

-- 5. SUNUCU TARAFLI MUTLAK KONTROL (Backend Enforcement & Filter Trigger)
CREATE OR REPLACE FUNCTION enforce_comment_settings()
RETURNS TRIGGER AS $$
DECLARE
    v_allow_comments BOOLEAN;
    v_comment_privacy TEXT;
    v_post_owner_id UUID;
    v_filter_words TEXT[];
    v_word TEXT;
BEGIN
    SELECT p.allow_comments, p.comment_privacy, p.user_id, pr.comment_filter_words
    INTO v_allow_comments, v_comment_privacy, v_post_owner_id, v_filter_words
    FROM posts p
    LEFT JOIN profiles pr ON pr.id = p.user_id
    WHERE p.id = NEW.post_id;

    IF v_allow_comments IS FALSE THEN
        RAISE EXCEPTION 'Bu gönderi yorumlara kapatılmıştır.';
    END IF;

    NEW.status := 'approved';

    IF v_filter_words IS NOT NULL AND array_length(v_filter_words, 1) > 0 THEN
        FOREACH v_word IN ARRAY v_filter_words
        LOOP
            IF NEW.content ILIKE '%' || v_word || '%' THEN
                NEW.status := 'pending';
                EXIT;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_comment_settings ON comments;
CREATE TRIGGER trigger_enforce_comment_settings
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION enforce_comment_settings();

-- 6. COMMENT LIKES TABLOSU (Gerçekçi ve Tekil Yorum Beğeni Takibi)
-- Not: comments.id tamsayı (BIGINT) olabileceğinden, tip çakışmasını önlemek adına
-- foreign key kısıtlaması esnek bırakılmış ve yerel gen_random_uuid() kullanılmıştır.
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id BIGINT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Yorum beğeni sayısını tetikleyici (Trigger) ile otomatik senkronize edelim
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

-- 7. SUPABASE REALTIME YAYIN İZİNLERİ (Çok Cihazlı Senkronizasyon İçin Şart)
-- Eğer tablolar henüz yayında değilse ekler, yayındaysa hata vermez.
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
EXCEPTION WHEN OTHERS THEN
    -- Zaten ekliyse veya yetki kısıtlaması varsa yoksay
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
EXCEPTION WHEN OTHERS THEN
END;
$$;
