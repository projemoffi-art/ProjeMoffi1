-- ====================================================================
-- SOHBETLER REALTIME ENTEGRASYONU
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- conversations Tablosunu Realtime (Anlık Güncelleme) Yayınına Ekleme
-- (Sohbet silindiğinde/sonlandırıldığında her iki tarafta da anında kapanmasını sağlar)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
END $$;
