-- KVKK Saklama ve Temizlik Politikası
-- 90 gün boyunca onaylanmamış hastaları 'expired' statüsüne çeker
-- 120 günü geçmiş 'expired' kayıtları (Kişisel veri) tamamen siler (purge)

-- 'expired' statüsüne izin vermek için olası bir CHECK constraint'ini esnetelim
ALTER TABLE public.unclaimed_patients DROP CONSTRAINT IF EXISTS unclaimed_patients_status_check;
ALTER TABLE public.unclaimed_patients ADD CONSTRAINT unclaimed_patients_status_check CHECK (status IN ('unclaimed', 'sms_sent', 'claimed', 'expired'));

-- 90 gün içinde claim edilmeyen kayıtları "expired" yap
CREATE OR REPLACE FUNCTION public.expire_old_unclaimed_patients()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.unclaimed_patients
    SET status = 'expired'
    WHERE status IN ('unclaimed', 'sms_sent')
      AND created_at < now() - INTERVAL '90 days';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 'expired' durumundakilerden 30 gün daha geçeni KALICI SİL
CREATE OR REPLACE FUNCTION public.purge_expired_unclaimed_patients()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.unclaimed_patients
    WHERE status = 'expired'
      AND created_at < now() - INTERVAL '120 days';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Günlük otomatik çalıştır (pg_cron)
SELECT cron.schedule('expire-unclaimed-patients-daily', '0 3 * * *',
    $$SELECT public.expire_old_unclaimed_patients(); SELECT public.purge_expired_unclaimed_patients();$$
);
