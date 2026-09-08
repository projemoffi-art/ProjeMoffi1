-- Migration: clinic_services

CREATE TABLE IF NOT EXISTS public.clinic_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Herkes hizmetleri görebilir" 
    ON public.clinic_services FOR SELECT 
    USING (true);

CREATE POLICY "Klinik kendi hizmetini yönetir" 
    ON public.clinic_services FOR ALL 
    USING (auth.uid() = clinic_id);

-- İzinler (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_services TO authenticated;
GRANT SELECT ON TABLE public.clinic_services TO anon;
