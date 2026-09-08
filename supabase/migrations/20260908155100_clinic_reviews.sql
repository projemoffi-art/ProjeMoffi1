-- Migration: clinic_reviews

CREATE TABLE IF NOT EXISTS public.clinic_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    clinic_reply TEXT,
    clinic_replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.clinic_reviews ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Herkes yorumları görebilir" 
    ON public.clinic_reviews FOR SELECT 
    USING (true);

CREATE POLICY "Kullanıcı kendi yorumunu düzenler" 
    ON public.clinic_reviews FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Klinik kendi yorumuna yanıt verir" 
    ON public.clinic_reviews FOR UPDATE 
    USING (auth.uid() = clinic_id);

CREATE POLICY "Kullanıcı kendi yorumunu siler" 
    ON public.clinic_reviews FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi randevusuna yorum yazar" 
    ON public.clinic_reviews FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.id = appointment_id
            AND a.user_id = auth.uid()
            AND a.clinic_id = clinic_reviews.clinic_id
            AND a.status = 'confirmed'
            AND a.appointment_date < now()
        )
    );

-- İzinler (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_reviews TO authenticated;
GRANT SELECT ON TABLE public.clinic_reviews TO anon;
