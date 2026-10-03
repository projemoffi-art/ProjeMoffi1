-- Yıldız Patiler adayları (yönetici): son 7 günün GERÇEK yürüyüş mesafesine göre. Eskiden istemci kendi göremediği
-- yürüyüşlere bakıyor (RLS yalnız sahibi), etkinlik yoksa hayvan kimliğinden "Aura puanı" uyduruyordu.
create or replace function public.admin_daily_star_candidates(p_limit integer default 10)
returns table (pet_id uuid, name text, breed text, avatar_url text, owner_username text, week_km numeric, walks integer)
language plpgsql stable security definer set search_path to 'public' as $$
begin
    if not public.is_platform_admin() then raise exception 'Yetkisiz' using errcode = '42501'; end if;
    return query
    select p.id, p.name, p.breed, p.avatar_url, coalesce(pr.username, pr.full_name),
           round(sum(w.distance_meters)::numeric / 1000, 1) as week_km,
           count(*)::integer as walks
      from public.walk_sessions w
      join public.pets p on p.id::text = w.pet_id
      left join public.profiles pr on pr.id = p.owner_id
     where w.status = 'completed'
       and w.start_time >= now() - interval '7 days'
     group by p.id, p.name, p.breed, p.avatar_url, pr.username, pr.full_name
    having sum(w.distance_meters) > 0
     order by week_km desc
     limit greatest(1, least(coalesce(p_limit, 10), 50));
end $$;
revoke execute on function public.admin_daily_star_candidates(integer) from public, anon;
grant execute on function public.admin_daily_star_candidates(integer) to authenticated;
