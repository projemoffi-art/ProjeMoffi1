-- Aşama 4, Bölüm 5: SMS Delivery Receipt (Teslim Onayı)
-- sms_log tablosuna teslim durumu kolonlarını ekleme

ALTER TABLE public.sms_log ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'unknown'));
ALTER TABLE public.sms_log ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.sms_log ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
