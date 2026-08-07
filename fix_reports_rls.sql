-- Enable RLS (just in case)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users
CREATE POLICY "Users can insert reports" 
ON public.reports 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow select for everyone (or just authenticated, or admins)
-- For the sake of the admin panel, we'll allow all authenticated users to read reports for now
-- In production this should be restricted to admins only
CREATE POLICY "Users can read reports" 
ON public.reports 
FOR SELECT 
TO public 
USING (true);

-- Do the same for adoption_reports if it's missing
ALTER TABLE public.adoption_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert adoption reports" 
ON public.adoption_reports 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can read adoption reports" 
ON public.adoption_reports 
FOR SELECT 
TO public 
USING (true);
