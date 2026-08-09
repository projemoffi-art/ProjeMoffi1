DROP FUNCTION IF EXISTS public.get_pet_verification_info(uuid);

CREATE OR REPLACE FUNCTION public.get_pet_verification_info(p_pet_id UUID)
RETURNS TABLE (
    pet_name TEXT,
    species TEXT,
    breed TEXT,
    avatar_url TEXT,
    is_vaccination_current BOOLEAN,
    latest_vaccines JSON,
    is_lost BOOLEAN,
    finder_message TEXT,
    reward_enabled BOOLEAN,
    reward_amount NUMERIC,
    owner_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_current BOOLEAN := true;
    v_latest_vaccines JSON;
    v_sos JSONB;
    v_show_phone BOOLEAN;
BEGIN
    SELECT NOT EXISTS (
        SELECT 1 FROM public.vaccines vs
        WHERE vs.pet_id = p_pet_id AND vs.status = 'pending' AND vs.next_due_date < now()
    ) INTO v_is_current;

    SELECT COALESCE(json_agg(json_build_object('name', vs.name, 'date', vs.date_administered)), '[]'::json)
    INTO v_latest_vaccines
    FROM (
        SELECT name, date_administered FROM public.vaccines
        WHERE pet_id = p_pet_id AND status = 'completed' AND date_administered IS NOT NULL
        ORDER BY date_administered DESC LIMIT 3
    ) vs;

    SELECT p.sos_settings, p.show_phone INTO v_sos, v_show_phone FROM public.pets p WHERE p.id = p_pet_id;

    RETURN QUERY
    SELECT
        p.name AS pet_name,
        p.type AS species,
        p.breed,
        p.avatar_url,
        v_is_current,
        v_latest_vaccines,
        COALESCE(p.is_lost, false) AS is_lost,
        v_sos->>'finder_message' AS finder_message,
        COALESCE((v_sos->>'reward_enabled')::boolean, false) AS reward_enabled,
        (v_sos->>'reward_amount')::numeric AS reward_amount,
        -- TELEFON SADECE show_phone=true VE pet kayıpsa döner, aksi halde NULL
        CASE WHEN COALESCE(p.is_lost, false) AND v_show_phone
             THEN v_sos->'owner'->>'phone'
             ELSE NULL
        END AS owner_phone
    FROM public.pets p
    WHERE p.id = p_pet_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pet_verification_info(UUID) TO anon, authenticated;
