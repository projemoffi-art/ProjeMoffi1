-- Künye (kayıp) ve karne doğrulama kodu ekranları için acil bilgiler; yalnızca sahip o yer için açtıysa döner.
create or replace function public.get_public_emergency_info(p_pet_id uuid, p_context text)
returns table (allergies text[], chronic_conditions text[], medications text[], blood_type text,
               vet_name text, vet_phone text)
language sql stable security definer set search_path = public as $$
    select hp.allergies, hp.chronic_conditions,
           coalesce((select array_agg(m.name order by m.name) from medications m
                     where m.pet_id = hp.pet_id and m.is_active
                       and (m.end_date is null or m.end_date >= (wall_now())::date)), '{}'),
           hp.blood_type, hp.primary_vet_name, hp.primary_vet_phone
    from pet_health_profile hp
    where hp.pet_id = p_pet_id
      and ((p_context = 'lost' and hp.show_on_lost) or (p_context = 'qr' and hp.show_on_qr));
$$;
revoke execute on function public.get_public_emergency_info(uuid, text) from public;
grant execute on function public.get_public_emergency_info(uuid, text) to anon, authenticated;
