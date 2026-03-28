-- =====================================================
-- MOFFI - Geri Dönüş ve Değerlendirme Sistemi
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT DEFAULT 'general', -- 'bug', 'suggestion', 'general', 'design'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback."
ON public.feedbacks FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Only admins can view feedback."
ON public.feedbacks FOR SELECT
USING (auth.uid() IN (SELECT id FROM profiles WHERE 'admin' = ANY(badges))); -- Assuming an admin badge exists
