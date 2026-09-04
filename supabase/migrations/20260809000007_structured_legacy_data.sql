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

    IF v_record.legacy_notes IS NOT NULL AND trim(v_record.legacy_notes) != '' THEN
        INSERT INTO public.medical_records (pet_id, clinic_id, vet_name, diagnosis, critical_notes, created_at)
        VALUES (
            v_new_pet_id,
            v_record.clinic_id,
            'Geçmiş Kayıt (Veri Göçü)',
            v_record.legacy_notes,
            'Bu kayıt eski sistemden aktarılmıştır, tarih kesin değildir.',
            v_record.created_at
        );
    END IF;

    UPDATE public.unclaimed_patients
    SET status = 'claimed', claimed_by_user_id = auth.uid(), claimed_pet_id = v_new_pet_id, claimed_at = now()
    WHERE id = p_unclaimed_id;

    RETURN v_new_pet_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_and_claim(UUID, TEXT) TO authenticated;

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

    IF v_record.legacy_notes IS NOT NULL AND trim(v_record.legacy_notes) != '' THEN
        INSERT INTO public.medical_records (pet_id, clinic_id, vet_name, diagnosis, critical_notes, created_at)
        VALUES (
            v_new_pet_id,
            v_record.clinic_id,
            'Geçmiş Kayıt (Veri Göçü)',
            v_record.legacy_notes,
            'Bu kayıt eski sistemden aktarılmıştır, tarih kesin değildir.',
            v_record.created_at
        );
    END IF;

    UPDATE public.unclaimed_patients
    SET status = 'claimed', claimed_by_user_id = v_record.claim_requested_by, claimed_pet_id = v_new_pet_id, claimed_at = now()
    WHERE id = p_unclaimed_id;

    RETURN v_new_pet_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_manual_claim(UUID) TO authenticated;
