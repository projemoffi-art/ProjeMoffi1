-- ====================================================================
-- EVCİL HAYVAN GÜNLÜK TAKİP VERİLERİ (PET_DAILY_STATS) TABLOSU
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin, 
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

CREATE TABLE IF NOT EXISTS public.pet_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    water_intake INTEGER DEFAULT 0,
    water_target INTEGER DEFAULT 1200,
    calories_intake INTEGER DEFAULT 0,
    calories_target INTEGER DEFAULT 800,
    food_log JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(pet_id, date)
);

-- Yetkilendirme (GRANT)
GRANT ALL ON TABLE public.pet_daily_stats TO postgres, service_role, authenticated, anon;

-- Satır Bazlı Güvenlik (RLS)
ALTER TABLE public.pet_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all users on pet_daily_stats" ON public.pet_daily_stats;
CREATE POLICY "Allow select for all users on pet_daily_stats" 
ON public.pet_daily_stats FOR SELECT 
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Allow all actions for all users on pet_daily_stats" ON public.pet_daily_stats;
CREATE POLICY "Allow all actions for pet owners on pet_daily_stats" 
ON public.pet_daily_stats FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pets 
        WHERE pets.id = pet_daily_stats.pet_id 
        AND pets.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pets 
        WHERE pets.id = pet_daily_stats.pet_id 
        AND pets.owner_id = auth.uid()
    )
);
