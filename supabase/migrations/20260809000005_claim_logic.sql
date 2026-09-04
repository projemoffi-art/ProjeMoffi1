ALTER TABLE public.unclaimed_patients ADD COLUMN IF NOT EXISTS claim_code TEXT;
ALTER TABLE public.unclaimed_patients ADD COLUMN IF NOT EXISTS claim_requested_by UUID REFERENCES auth.users(id);

-- Kullanıcı kayıt olduğunda/profil telefonunu girdiğinde çağrılır.
-- Eşleşme varsa "aday" olarak işaretler, otomatik claim ETMEZ.
CREATE OR REPLACE FUNCTION public.check_unclaimed_matches(p_phone TEXT)
RETURNS TABLE(id UUID, pet_name TEXT, clinic_id TEXT, sms_verified_available BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_normalized TEXT;
BEGIN
    v_normalized := regexp_replace(p_phone, '[^0-9]', '', 'g');
    IF left(v_normalized, 1) = '0' THEN v_normalized := '+9' || v_normalized;
    ELSIF left(v_normalized, 2) != '90' THEN v_normalized := '+90' || v_normalized;
    ELSE v_normalized := '+' || v_normalized; END IF;

    RETURN QUERY
    SELECT up.id, up.pet_name, up.clinic_id,
        EXISTS(SELECT 1 FROM public.clinic_sms_settings s WHERE s.clinic_id = up.clinic_id AND s.is_active = true)
    FROM public.unclaimed_patients up
    WHERE up.normalized_phone = v_normalized AND up.status IN ('unclaimed', 'sms_sent');
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_unclaimed_matches(TEXT) TO authenticated;

-- Kod doğrulanınca (gerçek SMS akışı) çağrılır — GERÇEK claim burada olur.
CREATE OR REPLACE FUNCTION public.verify_and_claim(p_unclaimed_id UUID, p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_new_pet_id UUID;
BEGIN
    SELECT * INTO v_record FROM public.unclaimed_patients
    WHERE id = p_unclaimed_id AND claim_code = p_code AND status = 'sms_sent';
    IF NOT FOUND THEN RAISE EXCEPTION 'Kod geçersiz veya kayıt zaten işlenmiş.'; END IF;

    INSERT INTO public.pets (owner_id, name, type, breed, health_notes)
    VALUES (auth.uid(), v_record.pet_name, v_record.pet_species, v_record.pet_breed, v_record.legacy_notes)
    RETURNING id INTO v_new_pet_id;

    UPDATE public.unclaimed_patients
    SET status = 'claimed', claimed_by_user_id = auth.uid(), claimed_pet_id = v_new_pet_id, claimed_at = now()
    WHERE id = p_unclaimed_id;

    RETURN v_new_pet_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_and_claim(UUID, TEXT) TO authenticated;

-- Mock modda: kullanıcı "bu benim" der, klinik onaylar (manuel).
CREATE OR REPLACE FUNCTION public.request_manual_claim(p_unclaimed_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.unclaimed_patients
    SET claim_requested_by = auth.uid()
    WHERE id = p_unclaimed_id AND status IN ('unclaimed', 'sms_sent');
    RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_manual_claim(UUID) TO authenticated;

-- Klinik onaylayınca (kendi panelinden) çağrılır.
CREATE OR REPLACE FUNCTION public.approve_manual_claim(p_unclaimed_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_new_pet_id UUID;
BEGIN
    SELECT * INTO v_record FROM public.unclaimed_patients
    WHERE id = p_unclaimed_id AND clinic_id = auth.uid()::text AND claim_requested_by IS NOT NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Yetkisiz veya kayıt bulunamadı.'; END IF;

    INSERT INTO public.pets (owner_id, name, type, breed, health_notes)
    VALUES (v_record.claim_requested_by, v_record.pet_name, v_record.pet_species, v_record.pet_breed, v_record.legacy_notes)
    RETURNING id INTO v_new_pet_id;

    UPDATE public.unclaimed_patients
    SET status = 'claimed', claimed_by_user_id = v_record.claim_requested_by, claimed_pet_id = v_new_pet_id, claimed_at = now()
    WHERE id = p_unclaimed_id;

    RETURN v_new_pet_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_manual_claim(UUID) TO authenticated;
