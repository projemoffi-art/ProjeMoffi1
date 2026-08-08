-- Her aşı için, her hatırlatma aşamasının (30/14/3/overdue) SADECE BİR KEZ
-- gönderildiğini garanti eden log tablosu.
CREATE TABLE IF NOT EXISTS public.vaccine_reminder_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('30d', '14d', '3d', 'overdue')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (vaccine_id, stage)  -- aynı aşama için aynı aşıya iki kez insert atılamaz
);

CREATE INDEX IF NOT EXISTS idx_vaccine_reminder_log_vaccine_id ON public.vaccine_reminder_log(vaccine_id);

GRANT ALL ON TABLE public.vaccine_reminder_log TO postgres, service_role;
ALTER TABLE public.vaccine_reminder_log ENABLE ROW LEVEL SECURITY;
-- Sadece service_role (Edge Function) yazar/okur, kullanıcı tarafına açık değil.

-- Eski tek-aşamalı kolonu artık kullanmıyoruz ama veri kaybı olmasın diye SİLMİYORUZ,
-- sadece kullanımdan kaldırıyoruz (deprecated). Silme kararını sonra beraber veririz.
COMMENT ON COLUMN public.vaccines.reminder_sent_at IS 'DEPRECATED - vaccine_reminder_log tablosu kullanılıyor artık';
