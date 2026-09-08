-- Migration: clinic_schedule_exceptions

CREATE TABLE IF NOT EXISTS public.clinic_schedule_exceptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT true,
    open_time TEXT,
    close_time TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(clinic_id, exception_date)
);

ALTER TABLE public.clinic_schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Herkes istisnaları görebilir" 
    ON public.clinic_schedule_exceptions FOR SELECT 
    USING (true);

CREATE POLICY "Klinik kendi istisnasını yönetir" 
    ON public.clinic_schedule_exceptions FOR ALL 
    USING (auth.uid() = clinic_id);

-- İzinler (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_schedule_exceptions TO authenticated;
GRANT SELECT ON TABLE public.clinic_schedule_exceptions TO anon;
