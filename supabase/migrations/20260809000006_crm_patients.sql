-- Bir kliniğin "kendi hastası" saydığı pet'ler: ya o klinikte en az bir 
-- medical_record'u olanlar, ya da o klinik tarafından claim edilenler.
CREATE OR REPLACE FUNCTION public.get_clinic_patients()
RETURNS TABLE(
    pet_id UUID, pet_name TEXT, species TEXT, breed TEXT, avatar_url TEXT,
    owner_id UUID, last_visit TIMESTAMP WITH TIME ZONE, source TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $`$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
        p.id, p.name, p.type, p.breed, p.avatar_url, p.owner_id,
        mr.created_at,
        CASE WHEN up.claimed_pet_id IS NOT NULL THEN 'migrated' ELSE 'appointment' END
    FROM public.pets p
    LEFT JOIN public.medical_records mr ON mr.pet_id = p.id AND mr.clinic_id = auth.uid()::text
    LEFT JOIN public.unclaimed_patients up ON up.claimed_pet_id = p.id AND up.clinic_id = auth.uid()::text
    WHERE mr.id IS NOT NULL OR up.id IS NOT NULL
    ORDER BY p.id, mr.created_at DESC NULLS LAST;
END;
$`$;
GRANT EXECUTE ON FUNCTION public.get_clinic_patients() TO authenticated;
