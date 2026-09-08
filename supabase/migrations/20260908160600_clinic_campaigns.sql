-- Migration: clinic_campaigns

CREATE TABLE IF NOT EXISTS public.clinic_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    media_url TEXT,
    discount_value TEXT,
    coupon_code TEXT,
    target_pet_type TEXT DEFAULT 'all',
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active'
);

ALTER TABLE public.clinic_campaigns ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Herkes kampanyaları görebilir" 
    ON public.clinic_campaigns FOR SELECT 
    USING (true);

CREATE POLICY "Klinik kendi kampanyasını yönetir" 
    ON public.clinic_campaigns FOR ALL 
    USING (auth.uid() = clinic_id);

-- İzinler (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_campaigns TO authenticated;
GRANT SELECT ON TABLE public.clinic_campaigns TO anon;
