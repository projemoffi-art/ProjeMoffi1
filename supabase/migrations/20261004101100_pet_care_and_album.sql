-- Ana sayfa üst kartı (design-reference/home-final/hero-card, Baran onayı 2026-10-03).
-- 1) Günlük bakım: öğün ve taze su. Hazır ama kullanılmayan pet_daily_stats'a bağlanır; yazma yalnızca log_pet_care ile.
--    Gün Türkiye takvim günüdür (Europe/Istanbul). Öğün hedefi pets.meals_per_day, boşsa yaş: 12 aydan küçük 3, değilse 2.
-- 2) Albüm: pet_media (fotoğraf/video) + pet_memories (elle anı). Özel depo 'pet-album', yalnızca sahibi görür.
--    Yükleme iki adım: reserve_pet_media (kota + yol sunucuda) → dosya yükleme (depo kuralı yalnızca ayrılmış yola izin verir)
--    → confirm_pet_media (dosya gerçekten var mı ve gerçek boyutu sınırda mı, depodan okunur). Kota album_limits()'te tek yerde.

-- ---------------------------------------------------------------- 1) Günlük bakım
alter table public.pet_daily_stats
    add column if not exists meals_given smallint not null default 0 check (meals_given between 0 and 12),
    add column if not exists water_refreshed_at timestamptz;
alter table public.pets add column if not exists meals_per_day smallint check (meals_per_day between 1 and 6);

-- Tablo artık yalnızca fonksiyonla yazılır; okuma sahibine RLS ile açık kalır.
revoke all on public.pet_daily_stats from anon;
revoke insert, update, truncate, references, trigger on public.pet_daily_stats from authenticated;

create or replace function public.pet_meals_target(p_pet uuid)
returns smallint language sql stable security definer set search_path to 'public' as $$
    select coalesce(p.meals_per_day,
        case when p.birth_date is not null and p.birth_date > (now() at time zone 'Europe/Istanbul')::date - interval '12 months' then 3 else 2 end)::smallint
    from public.pets p where p.id = p_pet;
$$;
revoke execute on function public.pet_meals_target(uuid) from public, anon;
grant execute on function public.pet_meals_target(uuid) to authenticated;

create or replace function public.pet_care_today(p_pet uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_day date := (now() at time zone 'Europe/Istanbul')::date;
    v_row public.pet_daily_stats;
begin
    if not exists (select 1 from public.pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    select * into v_row from public.pet_daily_stats where pet_id = p_pet and date = v_day;
    return json_build_object(
        'date', v_day,
        'meals_given', coalesce(v_row.meals_given, 0),
        'meals_target', public.pet_meals_target(p_pet),
        'water_refreshed_at', v_row.water_refreshed_at
    );
end $$;
revoke execute on function public.pet_care_today(uuid) from public, anon;
grant execute on function public.pet_care_today(uuid) to authenticated;

-- p_kind: 'meal' (bir öğün verildi / p_undo ile geri al), 'water' (taze su verildi / geri al)
create or replace function public.log_pet_care(p_pet uuid, p_kind text, p_undo boolean default false)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_day date := (now() at time zone 'Europe/Istanbul')::date;
begin
    if not exists (select 1 from public.pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    if p_kind not in ('meal', 'water') then
        raise exception 'Geçersiz kayıt türü' using errcode = '22023';
    end if;

    insert into public.pet_daily_stats (pet_id, date) values (p_pet, v_day)
    on conflict (pet_id, date) do nothing;

    if p_kind = 'meal' then
        update public.pet_daily_stats
           set meals_given = case when p_undo then greatest(meals_given - 1, 0) else least(meals_given + 1, 12) end,
               updated_at = now()
         where pet_id = p_pet and date = v_day;
    else
        update public.pet_daily_stats
           set water_refreshed_at = case when p_undo then null else now() end,
               updated_at = now()
         where pet_id = p_pet and date = v_day;
    end if;

    return public.pet_care_today(p_pet);
end $$;
revoke execute on function public.log_pet_care(uuid, text, boolean) from public, anon;
grant execute on function public.log_pet_care(uuid, text, boolean) to authenticated;

create or replace function public.set_pet_meals_per_day(p_pet uuid, p_meals smallint)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
    if p_meals is not null and (p_meals < 1 or p_meals > 6) then
        raise exception 'Günlük öğün 1 ile 6 arasında olmalı' using errcode = '22023';
    end if;
    update public.pets set meals_per_day = p_meals where id = p_pet and owner_id = auth.uid();
    if not found then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    return public.pet_care_today(p_pet);
end $$;
revoke execute on function public.set_pet_meals_per_day(uuid, smallint) from public, anon;
grant execute on function public.set_pet_meals_per_day(uuid, smallint) to authenticated;

-- ---------------------------------------------------------------- 2) Albüm ve anılar
create table if not exists public.pet_memories (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    owner_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(btrim(title)) between 1 and 80),
    note text check (note is null or char_length(note) <= 1000),
    memory_date date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists pet_memories_pet_idx on public.pet_memories (pet_id, memory_date desc);

create table if not exists public.pet_media (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    owner_id uuid not null references auth.users(id) on delete cascade,
    memory_id uuid references public.pet_memories(id) on delete set null,
    kind text not null check (kind in ('photo', 'video')),
    path text not null unique,
    thumb_path text not null unique,
    mime_type text not null,
    bytes integer not null check (bytes > 0),
    width integer,
    height integer,
    duration_seconds numeric(5,1),
    status text not null default 'pending' check (status in ('pending', 'ready')),
    taken_at timestamptz,
    created_at timestamptz not null default now()
);
create index if not exists pet_media_pet_idx on public.pet_media (pet_id, status, created_at desc);
create index if not exists pet_media_memory_idx on public.pet_media (memory_id) where memory_id is not null;

alter table public.pet_memories enable row level security;
alter table public.pet_media enable row level security;
create policy pet_memories_owner_read on public.pet_memories for select to authenticated using (owner_id = auth.uid());
create policy pet_media_owner_read on public.pet_media for select to authenticated using (owner_id = auth.uid());
revoke all on public.pet_memories, public.pet_media from anon, authenticated;
grant select on public.pet_memories, public.pet_media to authenticated;

-- Kota ve sınırlar tek yerde (Baran onayı 2026-10-03; ayrıntılı gözden geçirme sonra, CLAUDE.md 12.x).
create or replace function public.album_limits()
returns json language sql stable security definer set search_path to 'public' as $$
    select case when public.has_prime(auth.uid()) then
        json_build_object('prime', true, 'photos_per_pet', 1000, 'memories_per_pet', null, 'video', true,
            'video_max_seconds', 30, 'video_max_bytes', 52428800, 'photo_max_bytes', 1572864)
    else
        json_build_object('prime', false, 'photos_per_pet', 50, 'memories_per_pet', 10, 'video', false,
            'video_max_seconds', 0, 'video_max_bytes', 0, 'photo_max_bytes', 1572864)
    end;
$$;
revoke execute on function public.album_limits() from public, anon;
grant execute on function public.album_limits() to authenticated;

create or replace function public.album_status(p_pet uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
begin
    if not exists (select 1 from public.pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    return json_build_object(
        'limits', public.album_limits(),
        'media_count', (select count(*) from public.pet_media where pet_id = p_pet and owner_id = auth.uid()),
        'memory_count', (select count(*) from public.pet_memories where pet_id = p_pet and owner_id = auth.uid())
    );
end $$;
revoke execute on function public.album_status(uuid) from public, anon;
grant execute on function public.album_status(uuid) to authenticated;

create or replace function public.reserve_pet_media(
    p_pet uuid, p_kind text, p_mime text, p_bytes integer,
    p_width integer default null, p_height integer default null, p_duration numeric default null,
    p_memory uuid default null, p_taken_at timestamptz default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid();
    v_limits json := public.album_limits();
    v_count integer;
    v_id uuid := gen_random_uuid();
    v_ext text;
    v_path text;
    v_thumb text;
begin
    if v_uid is null or not exists (select 1 from public.pets where id = p_pet and owner_id = v_uid) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    if p_memory is not null and not exists (select 1 from public.pet_memories where id = p_memory and pet_id = p_pet and owner_id = v_uid) then
        raise exception 'Anı bulunamadı' using errcode = '42501';
    end if;

    if p_kind = 'photo' then
        v_ext := case p_mime when 'image/webp' then 'webp' when 'image/jpeg' then 'jpg' end;
        if v_ext is null then raise exception 'Fotoğraf biçimi desteklenmiyor' using errcode = '22023'; end if;
        if p_bytes is null or p_bytes <= 0 or p_bytes > (v_limits->>'photo_max_bytes')::int then
            raise exception 'Fotoğraf çok büyük' using errcode = '22023';
        end if;
    elsif p_kind = 'video' then
        if not (v_limits->>'video')::boolean then
            raise exception 'Video yüklemek Moffi Prime ile açılır' using errcode = 'P0001', hint = 'prime';
        end if;
        v_ext := case p_mime when 'video/mp4' then 'mp4' when 'video/quicktime' then 'mov' when 'video/webm' then 'webm' end;
        if v_ext is null then raise exception 'Video biçimi desteklenmiyor (MP4, MOV, WebM)' using errcode = '22023'; end if;
        if p_duration is null or p_duration <= 0 or p_duration > (v_limits->>'video_max_seconds')::numeric then
            raise exception 'Video en fazla % saniye olabilir', v_limits->>'video_max_seconds' using errcode = '22023';
        end if;
        if p_bytes is null or p_bytes <= 0 or p_bytes > (v_limits->>'video_max_bytes')::int then
            raise exception 'Video çok büyük (en fazla 50 MB)' using errcode = '22023';
        end if;
    else
        raise exception 'Geçersiz tür' using errcode = '22023';
    end if;

    -- Yarım kalmış (bir günden eski, onaylanmamış) ayırmalar kotayı tutmaz; temizliği remove_stale_pet_media yapar.
    select count(*) into v_count from public.pet_media
     where pet_id = p_pet and owner_id = v_uid and (status = 'ready' or created_at > now() - interval '1 day');
    if v_count >= (v_limits->>'photos_per_pet')::int then
        raise exception 'Albüm dolu (% dosya)', v_limits->>'photos_per_pet' using errcode = 'P0001', hint = 'quota';
    end if;

    v_path := v_uid || '/' || p_pet || '/' || v_id || '.' || v_ext;
    v_thumb := v_uid || '/' || p_pet || '/' || v_id || '_t.' || case when p_mime = 'image/jpeg' then 'jpg' else 'webp' end;

    insert into public.pet_media (id, pet_id, owner_id, memory_id, kind, path, thumb_path, mime_type, bytes, width, height, duration_seconds, taken_at)
    values (v_id, p_pet, v_uid, p_memory, p_kind, v_path, v_thumb, p_mime, p_bytes, p_width, p_height, p_duration, p_taken_at);

    return json_build_object('id', v_id, 'path', v_path, 'thumb_path', v_thumb);
end $$;
revoke execute on function public.reserve_pet_media(uuid, text, text, integer, integer, integer, numeric, uuid, timestamptz) from public, anon;
grant execute on function public.reserve_pet_media(uuid, text, text, integer, integer, integer, numeric, uuid, timestamptz) to authenticated;

-- Dosyalar gerçekten yüklendi mi ve depodaki gerçek boyut sınırda mı (istemcinin söylediği boyuta güvenilmez).
create or replace function public.confirm_pet_media(p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_m public.pet_media;
    v_limits json := public.album_limits();
    v_size bigint;
    v_max bigint;
begin
    select * into v_m from public.pet_media where id = p_id and owner_id = auth.uid();
    if not found then raise exception 'Dosya bulunamadı' using errcode = '42501'; end if;
    if v_m.status = 'ready' then return json_build_object('id', v_m.id, 'status', 'ready'); end if;

    select (metadata->>'size')::bigint into v_size from storage.objects where bucket_id = 'pet-album' and name = v_m.path;
    if v_size is null or not exists (select 1 from storage.objects where bucket_id = 'pet-album' and name = v_m.thumb_path) then
        raise exception 'Dosya yüklenmemiş' using errcode = 'P0001';
    end if;
    v_max := case when v_m.kind = 'video' then (v_limits->>'video_max_bytes')::bigint else (v_limits->>'photo_max_bytes')::bigint end;
    if v_size > v_max then
        raise exception 'Dosya sınırı aşıyor' using errcode = 'P0001', hint = 'size';
    end if;

    update public.pet_media set status = 'ready', bytes = v_size where id = p_id;
    return json_build_object('id', v_m.id, 'status', 'ready');
end $$;
revoke execute on function public.confirm_pet_media(uuid) from public, anon;
grant execute on function public.confirm_pet_media(uuid) to authenticated;

create or replace function public.save_pet_memory(p_id uuid, p_pet uuid, p_title text, p_note text, p_date date)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid();
    v_limits json := public.album_limits();
    v_id uuid;
begin
    if v_uid is null or not exists (select 1 from public.pets where id = p_pet and owner_id = v_uid) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    if p_title is null or char_length(btrim(p_title)) = 0 then raise exception 'Anıya bir başlık ver' using errcode = '22023'; end if;
    if char_length(btrim(p_title)) > 80 then raise exception 'Başlık en fazla 80 karakter' using errcode = '22023'; end if;
    if p_note is not null and char_length(p_note) > 1000 then raise exception 'Not en fazla 1000 karakter' using errcode = '22023'; end if;
    if p_date is null or p_date > (now() at time zone 'Europe/Istanbul')::date then raise exception 'Anı tarihi ileri bir gün olamaz' using errcode = '22023'; end if;

    if p_id is null then
        if (v_limits->>'memories_per_pet') is not null
           and (select count(*) from public.pet_memories where pet_id = p_pet and owner_id = v_uid) >= (v_limits->>'memories_per_pet')::int then
            raise exception 'Anı sınırına ulaştın (% anı)', v_limits->>'memories_per_pet' using errcode = 'P0001', hint = 'quota';
        end if;
        insert into public.pet_memories (pet_id, owner_id, title, note, memory_date)
        values (p_pet, v_uid, btrim(p_title), nullif(btrim(coalesce(p_note, '')), ''), p_date)
        returning id into v_id;
    else
        update public.pet_memories
           set title = btrim(p_title), note = nullif(btrim(coalesce(p_note, '')), ''), memory_date = p_date, updated_at = now()
         where id = p_id and pet_id = p_pet and owner_id = v_uid
        returning id into v_id;
        if v_id is null then raise exception 'Anı bulunamadı' using errcode = '42501'; end if;
    end if;
    return v_id;
end $$;
revoke execute on function public.save_pet_memory(uuid, uuid, text, text, date) from public, anon;
grant execute on function public.save_pet_memory(uuid, uuid, text, text, date) to authenticated;

-- Fotoğraf/videonun bir anıya bağlanması ya da anıdan çıkarılması (dosya albümde kalır).
create or replace function public.set_pet_media_memory(p_media uuid, p_memory uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if p_memory is not null and not exists (
        select 1 from public.pet_memories mem join public.pet_media m on m.pet_id = mem.pet_id
         where mem.id = p_memory and m.id = p_media and mem.owner_id = auth.uid()) then
        raise exception 'Anı bulunamadı' using errcode = '42501';
    end if;
    update public.pet_media set memory_id = p_memory where id = p_media and owner_id = auth.uid();
    if not found then raise exception 'Dosya bulunamadı' using errcode = '42501'; end if;
end $$;
revoke execute on function public.set_pet_media_memory(uuid, uuid) from public, anon;
grant execute on function public.set_pet_media_memory(uuid, uuid) to authenticated;

-- Özel depo: 50 MB üst sınır (video), yalnızca albüm biçimleri.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-album', 'pet-album', false, 52428800,
        array['image/webp', 'image/jpeg', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Okuma: kendi klasörü. Yazma: yalnızca reserve_pet_media'nın ayırdığı, henüz onaylanmamış yol. Güncelleme yok.
create policy pet_album_owner_read on storage.objects for select to authenticated
    using (bucket_id = 'pet-album' and (storage.foldername(name))[1] = auth.uid()::text);
create policy pet_album_reserved_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'pet-album' and exists (
        select 1 from public.pet_media m
         where m.owner_id = auth.uid() and m.status = 'pending' and (m.path = name or m.thumb_path = name)));
