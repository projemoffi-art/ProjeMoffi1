-- Rozet vitrini: sahibinin "Profilimde göster" dediği rozetler (en çok 3 / hayvan) profilde herkese görünür.
-- Yalnızca vitrine konmuş rozetin adı/ikonu ve hayvanın adı döner; ilerleme ve diğer rozetler gizli kalır.
create or replace function public.featured_badges(p_owner uuid)
returns json language sql stable security definer set search_path to 'public' as $$
    select coalesce(json_agg(json_build_object('key', b.key, 'title', b.title, 'icon', b.icon, 'pet_name', p.name, 'earned_at', pb.earned_at)
                    order by pb.earned_at desc), '[]'::json)
      from pet_badges pb
      join pets p on p.id = pb.pet_id
      join badge_defs b on b.key = pb.badge_key
     where p.owner_id = p_owner and pb.featured
$$;
revoke execute on function public.featured_badges(uuid) from public, anon;
grant execute on function public.featured_badges(uuid) to authenticated;
