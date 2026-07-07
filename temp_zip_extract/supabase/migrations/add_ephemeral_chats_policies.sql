-- ====================================================================
-- GEÇİCİ SOHBETLER RLS POLİTİKALARI VE CASCADE DELETE DÜZENLEMESİ
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

-- 1. messages tablosunun conversations tablosuna olan foreign key kısıtlamasını CASCADE DELETE ile güncelleyelim.
-- (Böylece bir sohbet silindiğinde içindeki tüm mesajlar otomatik olarak silinir ve hata oluşmaz)
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) 
REFERENCES public.conversations(id) 
ON DELETE CASCADE;

-- 2. conversations tablosu için RLS politikaları
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for participants" ON public.conversations;
CREATE POLICY "Allow select for participants" ON public.conversations
FOR SELECT TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Allow insert for participants" ON public.conversations;
CREATE POLICY "Allow insert for participants" ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Allow update for participants" ON public.conversations;
CREATE POLICY "Allow update for participants" ON public.conversations
FOR UPDATE TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Allow delete for participants" ON public.conversations;
CREATE POLICY "Allow delete for participants" ON public.conversations
FOR DELETE TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 3. messages tablosu için RLS politikaları
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for conversation participants" ON public.messages;
CREATE POLICY "Allow select for conversation participants" ON public.messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
);

DROP POLICY IF EXISTS "Allow insert for sender" ON public.messages;
CREATE POLICY "Allow insert for sender" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
);

DROP POLICY IF EXISTS "Allow delete for conversation participants" ON public.messages;
CREATE POLICY "Allow delete for conversation participants" ON public.messages
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
);
