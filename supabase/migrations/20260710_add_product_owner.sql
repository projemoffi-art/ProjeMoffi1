ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id);
