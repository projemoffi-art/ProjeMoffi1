CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    reference_id TEXT,
    date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinics can view their own transactions" ON public.transactions
    FOR SELECT TO authenticated
    USING (clinic_id = auth.uid());

-- Allow service role and admins to insert
CREATE POLICY "Admins can insert transactions" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (true);
