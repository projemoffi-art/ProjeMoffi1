-- Drop vet_advices table if it exists to apply schema cleanly
DROP TABLE IF EXISTS public.vet_advices CASCADE;

-- Create vet_advices table in public schema
CREATE TABLE IF NOT EXISTS public.vet_advices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id TEXT, -- Changed from UUID to TEXT to support string/text ids like 'biz_vet1'
    content TEXT NOT NULL,
    badge TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vet_advices ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read vet_advices
CREATE POLICY "Allow public read access to vet_advices" 
ON public.vet_advices 
FOR SELECT 
USING (true);

-- Policy: Authenticated/anonymous users can write to vet_advices (matching clinic_settings permissions)
CREATE POLICY "Allow write access to vet_advices" 
ON public.vet_advices 
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Index for querying recent advices
CREATE INDEX IF NOT EXISTS idx_vet_advices_created_at ON public.vet_advices(created_at DESC);
