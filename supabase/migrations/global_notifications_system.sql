-- ====================================================================
-- MOFFI OTONOM BİLDİRİM SİSTEMİ ALTYAPISI (INSTAGRAM MİMARİSİ)
-- ====================================================================

-- 1. Bildirimler tablosunu profesyonelleştir (Eksik sütunları ekle)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- 2. BEĞENİ (LIKE) TETİKLEYİCİSİ
CREATE OR REPLACE FUNCTION trigger_notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_actor_name TEXT;
BEGIN
    -- Gönderinin sahibini bul
    SELECT user_id INTO v_post_owner_id FROM posts WHERE id = NEW.post_id;
    
    -- Kendi gönderisini beğenirse bildirim atma
    IF v_post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Beğenen kişinin adını al
    SELECT COALESCE(full_name, username, 'Biri') INTO v_actor_name FROM profiles WHERE id = NEW.user_id;

    -- Eski bildirimi sil (kullanıcı sürekli beğen/kaldır yapıp spam atamasın diye)
    DELETE FROM notifications 
    WHERE user_id = v_post_owner_id AND actor_id = NEW.user_id AND type = 'like' AND entity_id = NEW.post_id::text;

    -- Yeni bildirimi ekle
    INSERT INTO notifications (user_id, actor_id, title, content, type, entity_id)
    VALUES (v_post_owner_id, NEW.user_id, v_actor_name || ' gönderini beğendi.', '❤️', 'like', NEW.post_id::text);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_like ON likes;
CREATE TRIGGER on_post_like
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION trigger_notify_post_like();

-- 3. BEĞENİ GERİ ÇEKME (UNLIKE) TETİKLEYİCİSİ
CREATE OR REPLACE FUNCTION trigger_notify_post_unlike()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM notifications 
    WHERE type = 'like' AND actor_id = OLD.user_id AND entity_id = OLD.post_id::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_unlike ON likes;
CREATE TRIGGER on_post_unlike
AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION trigger_notify_post_unlike();

-- 4. YORUM (COMMENT) TETİKLEYİCİSİ
CREATE OR REPLACE FUNCTION trigger_notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_actor_name TEXT;
BEGIN
    SELECT user_id INTO v_post_owner_id FROM posts WHERE id = NEW.post_id;
    
    IF v_post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(full_name, username, 'Biri') INTO v_actor_name FROM profiles WHERE id = NEW.user_id;

    INSERT INTO notifications (user_id, actor_id, title, content, type, entity_id)
    VALUES (v_post_owner_id, NEW.user_id, v_actor_name || ' gönderine yorum yaptı.', NEW.content, 'comment', NEW.post_id::text);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_comment ON comments;
CREATE TRIGGER on_post_comment
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION trigger_notify_post_comment();

-- 5. REALTIME YAYIN İZİNLERİ (Soket Üzerinden Anlık Bildirim Düşmesi İçin)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN OTHERS THEN
END;
$$;
