ALTER TABLE public.adoption_ads 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pet_type TEXT DEFAULT 'cat',
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_apartment_friendly BOOLEAN DEFAULT false;

-- RLS Politikalarını Düzenle (İlan sahibi kendi ilanlarını -pending olsa bile- görebilmeli)
DROP POLICY IF EXISTS "Anyone can view active adoption ads" ON public.adoption_ads;
CREATE POLICY "Anyone can view adoption ads"
    ON public.adoption_ads FOR SELECT
    USING (status = 'active' OR auth.uid() = user_id);

-- adoption_applications tablosunda isim uyumsuzluğunu düzelt
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='adoption_applications' AND column_name='home_condition') THEN
    ALTER TABLE public.adoption_applications RENAME COLUMN home_condition TO home_conditions;
  END IF;
END $$;

-- Supabase Şema Önbelleğini Yenile
NOTIFY pgrst, 'reload schema';
