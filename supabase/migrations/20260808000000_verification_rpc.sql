-- Sadece doğrulama için gereken minimal, güvenli alanları döndüren fonksiyon.
-- Sahip telefonu/adresi gibi hassas veri KESİNLİKLE dönmüyor.
CREATE OR REPLACE FUNCTION public.get_pet_verification_info(p_pet_id UUID)
RETURNS TABLE (
    pet_name TEXT,
    species TEXT,
    breed TEXT,
    avatar_url TEXT,
    microchip TEXT,
    is_vaccination_current BOOLEAN,
    latest_vaccines JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name,
        p.type,
        p.breed,
        p.image,
        p.microchip,
        NOT EXISTS (
            SELECT 1 FROM public.vaccines v
            WHERE v.pet_id = p_pet_id
            AND v.status = 'pending'
            AND v.next_due_date < now()
        ) AS is_vaccination_current,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('name', v.name, 'date', v.date_administered))
             FROM public.vaccines v
             WHERE v.pet_id = p_pet_id AND v.status = 'completed'
             ORDER BY v.date_administered DESC LIMIT 5),
            '[]'::jsonb
        ) AS latest_vaccines
    FROM public.pets p
    WHERE p.id = p_pet_id;
END;
$$;

-- Anon (giriş yapmamış) kullanıcılar bu fonksiyonu çağırabilsin — ama SADECE
-- bu fonksiyonu, tabloların kendisine direkt erişim YOK.
GRANT EXECUTE ON FUNCTION public.get_pet_verification_info(UUID) TO anon, authenticated;
