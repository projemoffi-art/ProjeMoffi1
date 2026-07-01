-- Create daily_stars table in public schema
CREATE TABLE IF NOT EXISTS public.daily_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge TEXT NOT NULL,
    media_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('published', 'auto')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_stars ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read daily_stars
CREATE POLICY "Allow public read access to daily_stars" 
ON public.daily_stars 
FOR SELECT 
USING (true);

-- Policy: Only admin users can insert/update/delete records
CREATE POLICY "Allow admin write access to daily_stars" 
ON public.daily_stars 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_daily_stars_date ON public.daily_stars(date);
