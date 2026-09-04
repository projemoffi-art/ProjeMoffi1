-- Mükerrer Yükleme Koruması (Duplicate Protection)
-- Aynı klinik, aynı numara ile mükerrer satır eklenmesini engeller.
-- Claim edilmiş kayıtları atlar.

CREATE OR REPLACE FUNCTION public.insert_unclaimed_patient(
    p_raw_name TEXT, p_raw_phone TEXT, p_pet_name TEXT,
    p_pet_species TEXT, p_pet_breed TEXT, p_legacy_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_normalized TEXT;
    v_existing_id UUID;
BEGIN
    v_normalized := regexp_replace(p_raw_phone, '[^0-9]', '', 'g');
    IF left(v_normalized, 1) = '0' THEN v_normalized := '+9' || v_normalized;
    ELSIF left(v_normalized, 2) != '90' THEN v_normalized := '+90' || v_normalized;
    ELSE v_normalized := '+' || v_normalized; END IF;

    -- Aynı klinik + aynı telefon, henüz claim edilmemiş bir kayıt var mı?
    SELECT id INTO v_existing_id FROM public.unclaimed_patients
    WHERE clinic_id = auth.uid()::text
      AND normalized_phone = v_normalized
      AND status IN ('unclaimed', 'sms_sent')
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Var olanı GÜNCELLE, yeni satır açma (mükerrer SMS/claim önlenir)
        UPDATE public.unclaimed_patients
        SET raw_name = p_raw_name, pet_name = p_pet_name,
            pet_species = p_pet_species, pet_breed = p_pet_breed,
            legacy_notes = COALESCE(p_legacy_notes, legacy_notes)
        WHERE id = v_existing_id;
        RETURN v_existing_id;
    END IF;

    INSERT INTO public.unclaimed_patients (
        clinic_id, raw_name, raw_phone, normalized_phone,
        pet_name, pet_species, pet_breed, legacy_notes
    ) VALUES (
        auth.uid()::text, p_raw_name, p_raw_phone, v_normalized,
        p_pet_name, p_pet_species, p_pet_breed, p_legacy_notes
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.insert_unclaimed_patient(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
