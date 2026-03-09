ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;
CREATE POLICY "Kullanıcılar kendi mesajlarını güncelleyebilir" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Kullanıcılar kendi mesajlarını silebilir" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);
