-- Yürüyüş B aşaması: tek doğru yürüyüş kaydı.
-- Kalori, rota önizlemesi ve başlangıç noktası bitişte sunucuda bir kez hesaplanıp saklanır; ekranlar kendi
-- formülünü yazmaz. Liste ekranları tam rotayı (binlerce nokta) değil 60 noktalık önizlemeyi çeker.
-- Çevrimdışı başlayan yürüyüş için oturum sonradan, gerçek başlangıç saatiyle açılabilir. Kullanıcı yürüyüşü
-- geçmişinden kaldırabilir (kayıt 'discarded' olur; istatistik/sıralama/rozetlerden çıkar).

alter table public.walk_sessions
    add column if not exists calories_kcal integer,
    add column if not exists route_preview jsonb,
    add column if not exists start_lat double precision,
    add column if not exists start_lng double precision;

-- Köpek yürüyüşü için kaba ama tutarlı tahmin: km × kg (kilo yoksa 15 kg). İstemcideki canlı gösterim
-- src/lib/walkMetrics.ts'te aynı formülü kullanır.
create or replace function public.walk_calories(p_distance_m numeric, p_weight_kg numeric)
returns integer
language sql
immutable
set search_path to 'public'
as $$
    select greatest(0, round(coalesce(p_distance_m, 0) / 1000.0 * coalesce(nullif(p_weight_kg, 0), 15)))::integer;
$$;

-- En fazla ~60 nokta: ilk ve son nokta her zaman dahil, aradakiler eşit aralıkla. [lat, lng] dizisi.
create or replace function public.walk_route_preview(p_path jsonb)
returns jsonb
language sql
immutable
set search_path to 'public'
as $$
    with pts as (
        select value, ordinality as i from jsonb_array_elements(coalesce(p_path, '[]'::jsonb)) with ordinality
    ), n as (select count(*)::integer as c from pts)
    select coalesce(jsonb_agg(jsonb_build_array(
               round(((value ->> 'lat')::numeric), 6), round(((value ->> 'lng')::numeric), 6)) order by i), '[]'::jsonb)
    from pts, n
    where n.c <= 60 or (i - 1) % ceil(n.c / 60.0)::integer = 0 or i = n.c;
$$;

revoke execute on function public.walk_calories(numeric, numeric) from public, anon, authenticated;
revoke execute on function public.walk_route_preview(jsonb) from public, anon, authenticated;

-- p_started_at: çevrimdışı başlayıp sonradan bağlanan yürüyüşün gerçek başlangıcı (son 12 saat içinde olmalı).
create or replace function public.start_walk_session(p_pet_id text default null, p_started_at timestamptz default null)
returns public.walk_sessions
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_row public.walk_sessions;
    v_start timestamptz := now();
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;
    if p_pet_id is not null and not exists (
        select 1 from public.pets where id::text = p_pet_id and owner_id = v_user
    ) then
        raise exception 'Bu hayvan sana ait değil';
    end if;
    if p_started_at is not null and p_started_at between now() - interval '12 hours' and now() + interval '2 minutes' then
        v_start := least(p_started_at, now());
    end if;

    -- Yarım kalmış oturum: bitiş "şu an" değil son konumun zamanıdır; hiç yol yoksa kayda girmez.
    update public.walk_sessions
    set status = case when coalesce(distance_meters, 0) > 0 then 'completed' else 'discarded' end,
        end_time = coalesce(last_point_at, start_time),
        active_seconds = coalesce(active_seconds, greatest(0, floor(extract(epoch from (coalesce(last_point_at, start_time) - start_time))))::integer),
        route_preview = public.walk_route_preview(path_coordinates),
        start_lat = (path_coordinates -> 0 ->> 'lat')::double precision,
        start_lng = (path_coordinates -> 0 ->> 'lng')::double precision,
        calories_kcal = public.walk_calories(distance_meters, (select p.weight from public.pets p where p.id::text = walk_sessions.pet_id))
    where user_id = v_user and status = 'active';

    insert into public.walk_sessions (user_id, pet_id, status, path_coordinates, distance_meters, start_time)
    values (v_user, p_pet_id, 'active', '[]'::jsonb, 0, v_start)
    returning * into v_row;

    return v_row;
end;
$$;

create or replace function public.finish_walk(
    p_session_id uuid,
    p_active_seconds integer default null,
    p_steps integer default null,
    p_points jsonb default '[]'::jsonb,
    p_end_at_last_point boolean default false
)
returns public.walk_sessions
language plpgsql
security definer
set search_path to 'public'
as $$
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
                    else least(p_steps, greatest(v_active, 1) * 4) end;

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
end;
$$;

-- Kullanıcı kendi yürüyüşünü geçmişinden kaldırır (kayıt silinmez, 'discarded' olur).
create or replace function public.discard_walk(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if auth.uid() is null then
        raise exception 'Giriş gerekli';
    end if;
    update public.walk_sessions
    set status = 'discarded'
    where id = p_session_id and user_id = auth.uid() and status = 'completed';
    if not found then
        raise exception 'Yürüyüş bulunamadı';
    end if;
end;
$$;

revoke execute on function public.start_walk_session(text, timestamptz) from public, anon;
revoke execute on function public.discard_walk(uuid) from public, anon;
revoke execute on function public.finish_walk(uuid, integer, integer, jsonb, boolean) from public, anon;
grant execute on function public.start_walk_session(text, timestamptz) to authenticated;
grant execute on function public.discard_walk(uuid) to authenticated;
grant execute on function public.finish_walk(uuid, integer, integer, jsonb, boolean) to authenticated;

-- Eski start_walk(text) yayındaki eski istemci için açık kalır; kaldırılması temizlik dosyasında.

-- Mevcut kayıtları yeni alanlara taşı. Eski kayıtların duraklama bilgisi yok: aktif süre = duvar saati.
update public.walk_sessions w
set route_preview = public.walk_route_preview(w.path_coordinates),
    start_lat = (w.path_coordinates -> 0 ->> 'lat')::double precision,
    start_lng = (w.path_coordinates -> 0 ->> 'lng')::double precision,
    calories_kcal = public.walk_calories(w.distance_meters, (select p.weight from public.pets p where p.id::text = w.pet_id)),
    active_seconds = coalesce(w.active_seconds, greatest(0, floor(extract(epoch from (w.end_time - w.start_time))))::integer)
where w.status = 'completed';

-- Ne yolu ne adımı olan eski "tamamlanmış" kayıtlar yeni kurala göre listeden çıkar.
update public.walk_sessions
set status = 'discarded'
where status = 'completed' and coalesce(distance_meters, 0) = 0 and coalesce(steps, 0) = 0;
