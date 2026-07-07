-- ====================================================================
-- GEÇİCİ SOHBETLER VE REALTIME MESAJLAŞMA ENTEGRASYONU
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. conversations Tablosuna İlan İlişkisi Ekleme
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS associated_ad_id UUID;

-- 2. messages Tablosunu Realtime (Anlık Yayın) Yayınına Ekleme
-- (Sayfa yenilenmeden mesajların anında düşmesini sağlar)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
