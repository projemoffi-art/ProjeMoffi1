-- Migration: appointment_notifications

CREATE TABLE IF NOT EXISTS public.appointment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.appointment_notifications ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Alıcı kendi bildirimini görür" 
    ON public.appointment_notifications FOR SELECT 
    USING (auth.uid() = recipient_id);

CREATE POLICY "Sistem bildirim oluşturabilir" 
    ON public.appointment_notifications FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Alıcı kendi bildirimini okundu yapabilir" 
    ON public.appointment_notifications FOR UPDATE 
    USING (auth.uid() = recipient_id);

-- İzinler (Grants)
GRANT SELECT, INSERT, UPDATE ON TABLE public.appointment_notifications TO authenticated;
