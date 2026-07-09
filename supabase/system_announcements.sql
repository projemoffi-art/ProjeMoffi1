CREATE TABLE IF NOT EXISTS public.system_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_url text,
  badge text,
  cta_text text,
  cta_type text,
  cta_value text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes okuyabilir" ON public.system_announcements
FOR SELECT TO public USING (true);

CREATE POLICY "Sadece admin yazabilir" ON public.system_announcements
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
