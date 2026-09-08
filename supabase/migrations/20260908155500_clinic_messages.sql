-- Migration: clinic_messages

CREATE TABLE IF NOT EXISTS public.clinic_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.clinic_messages ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Taraflar kendi mesajlarını görebilir" 
    ON public.clinic_messages FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() = clinic_id);

CREATE POLICY "Taraflar mesaj gönderebilir" 
    ON public.clinic_messages FOR INSERT 
    WITH CHECK ((auth.uid() = user_id AND sender_role = 'user') OR (auth.uid() = clinic_id AND sender_role = 'clinic'));

CREATE POLICY "Taraflar kendi aldığı mesajı okundu işaretleyebilir" 
    ON public.clinic_messages FOR UPDATE 
    USING (auth.uid() = user_id OR auth.uid() = clinic_id);

-- İzinler (Grants)
GRANT SELECT, INSERT, UPDATE ON TABLE public.clinic_messages TO authenticated;
