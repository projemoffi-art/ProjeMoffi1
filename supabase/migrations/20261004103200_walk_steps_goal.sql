-- Günlük yürüyüş hedefi ADIM (Baran, 2026-10-04: "önceliğimiz adım").
-- Bir yürüyüşün hedefe sayılan adımı = algılayıcının ölçtüğü adım ile GPS mesafesinin adım karşılığının büyüğü (1 km = 1.300 adım,
-- uygulamanın adım katsayısı). Böylece adım sayacı olmayan telefonda da hedef tamamlanır, sayacı olan telefonda gerçek adım sayılır.
-- Algılayıcı adımı sunucuda süreyle sınırlanır: dakikada en çok 180 adım (önceden 240; tempolu yürüyüş ~100–130, hafif koşu ~160).
-- Hedef hayvan başına pets.walk_goal_steps (elle) ya da otomatik (son yürüyüşlerden); km hedefi (walk_goal_km) yalnızca eski
-- istemciler için eşlenir. Günlük "Yürüyüş" görevi ve hedef halkası artık adımla.

create or replace function public.walk_steps_per_km() returns integer
language sql immutable set search_path to 'public' as $$ select 1300 $$;

create or replace function public.walk_credited_steps(p_steps integer, p_distance_m numeric) returns integer
language sql immutable set search_path to 'public' as $$
    select greatest(coalesce(p_steps, 0), round(coalesce(p_distance_m, 0) / 1000.0 * walk_steps_per_km())::integer)
$$;

alter table public.pets add column if not exists walk_goal_steps integer;
update public.pets set walk_goal_steps = (round(walk_goal_km * walk_steps_per_km() / 500.0) * 500)::integer
 where walk_goal_km is not null and walk_goal_steps is null;

-- Otomatik hedef: son 10 yürüyüşün ortalama sayılan adımının %110'u (500'e yuvarlı, 1.500–12.000); 3'ten az yürüyüşte boyuta göre.
create or replace function public.pet_walk_goal_auto_steps(p_pet uuid)
returns integer language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_pet record;
    v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_avg numeric; v_n int; v_goal int;
begin
    select size, birth_date into v_pet from pets where id = p_pet;
    select avg(s), count(*) into v_avg, v_n from (
        select walk_credited_steps(steps, distance_meters) s from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time < v_day_start
           and (distance_meters > 200 or coalesce(steps, 0) > 300)
         order by start_time desc limit 10) w;
    if v_n >= 3 then
        v_goal := least(greatest((round(v_avg * 1.1 / 500) * 500)::int, 1500), 12000);
    else
        v_goal := case v_pet.size when 'Mini' then 1500 when 'Küçük' then 2000 when 'Büyük' then 3500 when 'Dev' then 3500 else 2500 end;
    end if;
    if v_pet.birth_date is not null and v_pet.birth_date > (current_date - interval '6 months') then
        v_goal := least(v_goal, 1500);
    end if;
    return v_goal;
end $$;

create or replace function public.pet_walk_goal_steps(p_pet uuid) returns integer
language sql stable security definer set search_path to 'public' as $$
    select coalesce((select walk_goal_steps from pets where id = p_pet), pet_walk_goal_auto_steps(p_pet))
$$;

create or replace function public.pet_walk_goal(p_pet uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v_manual int; v_auto int; v_goal int;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    select walk_goal_steps into v_manual from pets where id = p_pet;
    v_auto := pet_walk_goal_auto_steps(p_pet);
    v_goal := coalesce(v_manual, v_auto);
    return json_build_object('goal_steps', v_goal, 'auto_steps', v_auto, 'manual_steps', v_manual,
        'steps_per_km', walk_steps_per_km(), 'goal_km', round(v_goal::numeric / walk_steps_per_km(), 2),
        -- eski istemci (yayın geçişi) km alanlarını okur
        'auto_km', round(v_auto::numeric / walk_steps_per_km(), 2), 'manual_km', round(v_manual::numeric / walk_steps_per_km(), 2));
end $$;

create or replace function public.set_pet_walk_goal_steps(p_pet uuid, p_steps integer)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v int;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    if p_steps is not null and (p_steps < 1000 or p_steps > 30000) then raise exception 'Hedef 1.000 ile 30.000 adım arasında olmalı'; end if;
    v := case when p_steps is null then null else (round(p_steps / 500.0) * 500)::int end;
    update pets set walk_goal_steps = v, walk_goal_km = case when v is null then null else round(v::numeric / walk_steps_per_km() * 2) / 2 end
     where id = p_pet;
    return pet_walk_goal(p_pet);
end $$;

-- Eski istemci (km) yayın geçişinde çalışmaya devam etsin: km'yi adıma çevirip aynı kayda yazar.
create or replace function public.set_pet_walk_goal(p_pet uuid, p_km numeric)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
    if p_km is not null and (p_km < 0.5 or p_km > 20) then raise exception 'Hedef 0,5 ile 20 km arasında olmalı'; end if;
    return set_pet_walk_goal_steps(p_pet, case when p_km is null then null
        else least(greatest((round(p_km * walk_steps_per_km() / 500.0) * 500)::int, 1000), 30000) end);
end $$;

-- Algılayıcı adımı: dakikada en çok 180 (önceden saniyede 4 = dakikada 240; sallayarak şişirilebiliyordu)
create or replace function public.finish_walk(p_session_id uuid, p_active_seconds integer default null, p_steps integer default null,
    p_points jsonb default '[]'::jsonb, p_end_at_last_point boolean default false)
returns walk_sessions language plpgsql security definer set search_path to 'public' as $$
declare
    v_user uuid := auth.uid();
    v_row public.walk_sessions;
    v_end timestamptz;
    v_wall integer;
    v_active integer;
    v_steps integer;
    v_weight numeric;
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;

    select * into v_row from public.walk_sessions where id = p_session_id and user_id = v_user;
    if not found then
        raise exception 'Yürüyüş bulunamadı';
    end if;
    if v_row.status <> 'active' then
        return v_row;
    end if;

    if p_points is not null and jsonb_typeof(p_points) = 'array' and jsonb_array_length(p_points) > 0 then
        perform public.append_walk_points(p_session_id, p_points);
    end if;

    select * into v_row from public.walk_sessions where id = p_session_id for update;
    select p.weight into v_weight from public.pets p where p.id::text = v_row.pet_id;

    v_end := case when p_end_at_last_point then coalesce(v_row.last_point_at, v_row.start_time) else now() end;
    v_wall := greatest(0, floor(extract(epoch from (v_end - v_row.start_time))))::integer;
    v_active := least(greatest(coalesce(p_active_seconds, v_wall), 0), v_wall);
    v_steps := case when p_steps is null or p_steps <= 0 then null
                    else least(p_steps, greatest(v_active, 1) * 3) end;

    update public.walk_sessions
    set status = case when coalesce(distance_meters, 0) > 0 or coalesce(v_steps, 0) > 0 then 'completed' else 'discarded' end,
        end_time = v_end,
        active_seconds = v_active,
        steps = v_steps,
        calories_kcal = public.walk_calories(distance_meters, v_weight),
        route_preview = public.walk_route_preview(path_coordinates),
        start_lat = (path_coordinates -> 0 ->> 'lat')::double precision,
        start_lng = (path_coordinates -> 0 ->> 'lng')::double precision
    where id = p_session_id
    returning * into v_row;

    return v_row;
end $$;

-- Görev: "Yürüyüş" artık adım hedefi
update public.quest_defs set metric = 'walk_steps_today', unit = 'adım', description = 'Bugünkü adım hedefini tamamla',
       how = 'Yürüyüşü uygulamadan başlat; gün içindeki tüm yürüyüşlerin adımları toplanır. Adım sayacı olmayan telefonda yürünen mesafe adıma çevrilir (1 km ≈ 1.300 adım).'
 where key = 'walk' and metric is distinct from 'walk_steps_today';

create or replace function public.qc_quest_target(p_pet uuid, p_key text) returns numeric
language sql stable security definer set search_path to 'public' as $$
    select case p_key
             when 'walk' then pet_walk_goal_steps(p_pet)::numeric
             when 'meals' then pet_meals_target(p_pet)::numeric
             else 1 end
$$;

create or replace function public.qc_quest_progress(p_pet uuid, p_key text, p_day date, p_baseline numeric, p_created timestamptz)
returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare v_from timestamptz := qc_ts(p_day); v_to timestamptz := qc_ts(p_day + 1); v_owner uuid; v numeric := 0;
begin
    select owner_id into v_owner from pets where id = p_pet;
    case p_key
        when 'walk' then
            select coalesce(sum(walk_credited_steps(steps, distance_meters)), 0) into v from walk_sessions
             where pet_id = p_pet::text and status = 'completed' and start_time >= v_from and start_time < v_to;
        when 'play' then select case when played_at is not null then 1 else 0 end into v from pet_daily_stats where pet_id = p_pet and date = p_day;
        when 'meals' then select meals_given into v from pet_daily_stats where pet_id = p_pet and date = p_day;
        when 'water' then select case when water_refreshed_at is not null then 1 else 0 end into v from pet_daily_stats where pet_id = p_pet and date = p_day;
        when 'vaccine_plan' then
            select (select count(*) from appointments where pet_id = p_pet and created_at >= p_created and status not in ('cancelled', 'rejected'))
                 + (select count(*) from vaccines where pet_id = p_pet and created_at >= p_created) into v;
        when 'emergency' then v := case when pet_emergency_set(p_pet) then 1 else 0 end;
        when 'passport' then v := greatest(p_baseline - pet_passport_missing(p_pet), 0);
        when 'weigh' then select count(*) into v from pet_weight_logs where pet_id = p_pet and created_at >= v_from and created_at < v_to;
        when 'learn' then select count(*) into v from lesson_reads where user_id = v_owner and read_at >= v_from and read_at < v_to;
        when 'photo' then v := pet_metric(p_pet, 'photo_count', v_from, v_to);
        when 'new_place' then v := pet_metric(p_pet, 'new_places', v_from, v_to);
        when 'post_pet' then v := pet_metric(p_pet, 'posts_with_pet', v_from, v_to);
        else v := 0;
    end case;
    return coalesce(v, 0);
end $$;

-- Bugünün henüz bitmemiş yürüyüş görevleri km hedefiyle üretilmişti: adım hedefine çevrilir (yoksa ilk adımda tamamlanırdı)
update public.pet_daily_quests set target = qc_quest_target(pet_id, 'walk'), progress = 0
 where quest_key = 'walk' and day = qc_day() and completed_at is null;

revoke execute on function public.walk_steps_per_km(), public.walk_credited_steps(integer, numeric), public.pet_walk_goal_auto_steps(uuid),
    public.pet_walk_goal_steps(uuid) from public, anon;
grant execute on function public.walk_steps_per_km(), public.walk_credited_steps(integer, numeric) to authenticated;
revoke execute on function public.pet_walk_goal_auto_steps(uuid), public.pet_walk_goal_steps(uuid) from authenticated;
revoke execute on function public.set_pet_walk_goal_steps(uuid, integer) from public, anon;
grant execute on function public.set_pet_walk_goal_steps(uuid, integer) to authenticated;
