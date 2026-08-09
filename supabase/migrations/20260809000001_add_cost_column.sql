ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS cost NUMERIC;
COMMENT ON COLUMN public.medical_records.cost IS 'Muayene/tedavi ücreti (TL), opsiyonel, veteriner tarafından girilir';
