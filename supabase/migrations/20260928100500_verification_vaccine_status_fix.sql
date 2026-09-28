-- Karne doğrulama kodu: "aşıları güncel" artık her aşının en son kaydına bakar (önceden sadece
-- planlanmış kayıtlara bakıyordu; uygulanmış aşının sonraki dozu geçse bile "güncel" diyordu).
CREATE OR REPLACE FUNCTION public.get_pet_verification_info(p_pet_id uuid)
 RETURNS TABLE(pet_name text, species text, breed text, avatar_url text, is_vaccination_current boolean, latest_vaccines json, is_lost boolean, finder_message text, reward_enabled boolean, reward_amount numeric, owner_phone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_is_current BOOLEAN := true;
    v_latest_vaccines JSON;
    v_sos JSONB;
    v_show_phone BOOLEAN;
BEGIN
    SELECT NOT EXISTS (
        SELECT 1 FROM (
            SELECT DISTINCT ON (coalesce(vs.definition_id, lower(vs.name)))
                   vs.next_due_date
            FROM public.vaccines vs
            WHERE vs.pet_id = p_pet_id
            ORDER BY coalesce(vs.definition_id, lower(vs.name)),
                     (vs.status = 'completed') DESC, coalesce(vs.date_administered, vs.created_at) DESC
        ) latest
        WHERE latest.next_due_date IS NOT NULL AND latest.next_due_date::date < (wall_now())::date
    ) INTO v_is_current;

    SELECT COALESCE(json_agg(json_build_object('name', vs.name,
                    'date', to_char(vs.date_administered at time zone 'Europe/Istanbul', 'DD.MM.YYYY'))), '[]'::json)
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
        CASE WHEN COALESCE(p.is_lost, false) AND v_show_phone
             THEN v_sos->'owner'->>'phone'
             ELSE NULL
        END AS owner_phone
    FROM public.pets p
    WHERE p.id = p_pet_id;
END;
$function$;
