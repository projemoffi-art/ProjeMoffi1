-- ====================================================================
-- GEÇİCİ SOHBETLER CASCADE TEMİZLEME TETİKLEYİCİSİ (TRIGGER)
-- ====================================================================
-- Bu SQL, kayıp ilanı silindiğinde veya pet güvende olarak işaretlendiğinde,
-- o ilana bağlı açılmış olan tüm sohbet odalarını ve mesajları veritabanından
-- otomatik olarak (cascade) silen tetikleyiciyi oluşturur.
--
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. Temizleme Fonksiyonunu Tanımla
CREATE OR REPLACE FUNCTION public.cleanup_lost_pet_conversations()
RETURNS TRIGGER AS $$
BEGIN
    -- Yabancı anahtar (foreign key) kısıtlamalarını bozmamak için 
    -- önce ilgili sohbetlere ait tüm mesajları (messages) siliyoruz.
    DELETE FROM public.messages
    WHERE conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE associated_ad_id = OLD.id
    );

    -- Ardından sohbet odalarının kendilerini (conversations) siliyoruz.
    DELETE FROM public.conversations
    WHERE associated_ad_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. lost_pets Tablosuna Tetikleyiciyi (Trigger) Ekle
DROP TRIGGER IF EXISTS tr_cleanup_lost_pet_conversations ON public.lost_pets;
CREATE TRIGGER tr_cleanup_lost_pet_conversations
AFTER DELETE ON public.lost_pets
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_lost_pet_conversations();
