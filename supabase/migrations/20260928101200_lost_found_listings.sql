-- Faz 1 — Kayıp & Bulunan (design-reference/community-final/kayip-bulunan-reference.jpg).
-- lost_pets artık hem "kayıp" hem "buldum" ilanını tutar; durum yaşam döngüsüdür (yayında → sonuçlandı → arşiv).
-- Görülme bildirimi, yakın çevre bildirimi, eşleştirme ve kavuşma sunucuda.

-- 1) İlan alanları ---------------------------------------------------------------------------------
alter table public.lost_pets
    add column if not exists kind text not null default 'lost',
    add column if not exists breed text,
    add column if not exists color text,
    add column if not exists gender text,
    add column if not exists age_text text,
    add column if not exists features text[] not null default '{}',
    add column if not exists approach_note text,
    add column if not exists situation text,
    add column if not exists chip_status text,
    add column if not exists contact_mode text not null default 'in_app',
    add column if not exists contact_phone text,
    add column if not exists notify_radius_km integer not null default 3,
    add column if not exists notified_at timestamptz,
    add column if not exists notified_count integer not null default 0,
    add column if not exists view_count integer not null default 0,
    add column if not exists share_count integer not null default 0,
    add column if not exists resolved_at timestamptz,
    add column if not exists resolution text,
    add column if not exists updated_at timestamptz not null default now();

update public.lost_pets set status = 'active' where status = 'lost' or status is null;
alter table public.lost_pets alter column status set default 'active';

alter table public.lost_pets drop constraint if exists lost_pets_kind_check;
alter table public.lost_pets add constraint lost_pets_kind_check check (kind in ('lost', 'found'));
alter table public.lost_pets drop constraint if exists lost_pets_status_check;
alter table public.lost_pets add constraint lost_pets_status_check check (status in ('active', 'resolved', 'archived'));
alter table public.lost_pets drop constraint if exists lost_pets_contact_mode_check;
alter table public.lost_pets add constraint lost_pets_contact_mode_check check (contact_mode in ('in_app', 'phone'));
alter table public.lost_pets drop constraint if exists lost_pets_radius_check;
alter table public.lost_pets add constraint lost_pets_radius_check check (notify_radius_km between 1 and 10);
alter table public.lost_pets drop constraint if exists lost_pets_features_check;
alter table public.lost_pets add constraint lost_pets_features_check check (cardinality(features) <= 12);

-- Sayaçlar ve yayın/sonuç alanları sadece sunucu fonksiyonlarıyla değişir.
create or replace function public.lost_pets_guard()
returns trigger language plpgsql set search_path = public as $$
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'INSERT' then
            new.status := 'active';
            new.notified_at := null; new.notified_count := 0; new.view_count := 0; new.share_count := 0;
            new.resolved_at := null; new.resolution := null;
        else
            new.kind := old.kind; new.user_id := old.user_id; new.status := old.status;
            new.notified_at := old.notified_at; new.notified_count := old.notified_count;
            new.view_count := old.view_count; new.share_count := old.share_count;
            new.resolved_at := old.resolved_at; new.resolution := old.resolution;
        end if;
    end if;
    new.updated_at := now();
    return new;
end;
$$;
drop trigger if exists lost_pets_guard on public.lost_pets;
create trigger lost_pets_guard before insert or update on public.lost_pets
for each row execute function public.lost_pets_guard();

-- Herkese açık kolonlar (telefon ve tam konum hariç).
revoke select on public.lost_pets from anon, authenticated;
grant select (id, user_id, pet_name, img_url, location_text, last_seen_date, reward_enabled, reward_amount,
              description, pet_type, status, created_at, pet_id, images, kind, breed, color, gender, age_text,
              features, approach_note, situation, chip_status, contact_mode, notify_radius_km, notified_at,
              notified_count, view_count, share_count, resolved_at, resolution, updated_at)
    on public.lost_pets to anon, authenticated;

drop view if exists public.lost_pet_cards;
create view public.lost_pet_cards as
select l.id, l.user_id, l.kind, l.status, l.pet_id, l.pet_name, l.pet_type, l.breed, l.color, l.gender, l.age_text,
       l.img_url, l.images, l.features, l.approach_note, l.situation, l.chip_status, l.description,
       l.location_text, l.last_seen_date, l.reward_enabled, l.reward_amount, l.contact_mode,
       case when l.user_id = auth.uid() or (l.contact_mode = 'phone' and auth.uid() is not null) then l.contact_phone end as contact_phone,
       l.notify_radius_km, l.notified_count, l.view_count, l.share_count, l.resolved_at, l.resolution,
       l.created_at, l.updated_at,
       case when l.user_id = auth.uid() then l.latitude else round((l.latitude / 0.003)::numeric) * 0.003 end as latitude,
       case when l.user_id = auth.uid() then l.longitude else round((l.longitude / 0.003)::numeric) * 0.003 end as longitude,
       coalesce(l.user_id = auth.uid(), false) as is_mine
from public.lost_pets l
where l.status <> 'archived' or l.user_id = auth.uid();
revoke all on public.lost_pet_cards from anon, authenticated;
grant select on public.lost_pet_cards to anon, authenticated;

-- 2) Yakın çevre bildirimi için kullanıcının seçtiği bölge (mahalle düzeyine yuvarlanır) -------------
alter table public.profiles
    add column if not exists lost_alerts_enabled boolean not null default false,
    add column if not exists alert_lat double precision,
    add column if not exists alert_lng double precision,
    add column if not exists alert_updated_at timestamptz;

create or replace function public.set_lost_alert_area(p_enabled boolean, p_lat double precision, p_lng double precision)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'Giriş gerekli.'; end if;
    update profiles set
        lost_alerts_enabled = coalesce(p_enabled, false),
        alert_lat = case when p_enabled and p_lat is not null then round((p_lat / 0.01)::numeric) * 0.01 end,
        alert_lng = case when p_enabled and p_lng is not null then round((p_lng / 0.01)::numeric) * 0.01 end,
        alert_updated_at = now()
    where id = auth.uid();
end;
$$;
revoke execute on function public.set_lost_alert_area(boolean, double precision, double precision) from public;
grant execute on function public.set_lost_alert_area(boolean, double precision, double precision) to authenticated;

create or replace function public.km_between(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
    select 6371 * 2 * asin(sqrt(power(sin(radians(lat2 - lat1) / 2), 2)
        + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

-- İlan verirken "bu alanda bildirim alacak kişi" sayısı (gerçek; konumunu paylaşmayı seçenler).
create or replace function public.count_lost_alert_users(p_lat double precision, p_lng double precision, p_radius_km integer)
returns integer language sql stable security definer set search_path = public as $$
    select count(*)::integer from profiles p
    where p.lost_alerts_enabled and p.alert_lat is not null and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
      and km_between(p_lat, p_lng, p.alert_lat, p.alert_lng) <= least(greatest(p_radius_km, 1), 10);
$$;
revoke execute on function public.count_lost_alert_users(double precision, double precision, integer) from public;
grant execute on function public.count_lost_alert_users(double precision, double precision, integer) to authenticated;

-- 3) Yayınlama: pasaport kayıp modu + yakın çevre bildirimi (bir kez) -------------------------------
create or replace function public.publish_lost_listing(p_listing_id uuid)
returns integer language plpgsql volatile security definer set search_path = public as $$
declare
    l public.lost_pets;
    v_count integer := 0;
    u record;
begin
    select * into l from lost_pets where id = p_listing_id;
    if not found or l.user_id <> auth.uid() then raise exception 'İlan bulunamadı.'; end if;
    if l.status <> 'active' then raise exception 'İlan yayında değil.'; end if;
    if l.notified_at is not null then return l.notified_count; end if;

    if l.kind = 'lost' and l.pet_id is not null then
        update pets set is_lost = true where id = l.pet_id and owner_id = auth.uid();
    end if;

    if l.latitude is not null and l.longitude is not null then
        for u in
            select p.id from profiles p
            where p.lost_alerts_enabled and p.alert_lat is not null and p.id <> l.user_id
              and km_between(l.latitude, l.longitude, p.alert_lat, p.alert_lng) <= l.notify_radius_km
        loop
            perform notify_user(u.id, 'lost',
                case when l.kind = 'lost' then 'Yakınında kayıp ' || coalesce(nullif(l.pet_name, ''), 'bir dost')
                     else 'Yakınında sahibini arayan bir dost bulundu' end,
                coalesce(l.location_text, 'Yakınında') || ' · ilana bakıp gördüysen haber ver.',
                l.user_id, l.id::text);
            v_count := v_count + 1;
        end loop;
    end if;

    update lost_pets set notified_at = now(), notified_count = v_count where id = l.id;
    return v_count;
end;
$$;
revoke execute on function public.publish_lost_listing(uuid) from public;
grant execute on function public.publish_lost_listing(uuid) to authenticated;

-- Bildirim alanını genişletmek: yeni yarıçapta henüz haber almamış kişilere bildirir.
create or replace function public.expand_lost_listing_radius(p_listing_id uuid, p_radius_km integer)
returns integer language plpgsql volatile security definer set search_path = public as $$
declare
    l public.lost_pets;
    v_old integer;
    v_new integer := least(greatest(p_radius_km, 1), 10);
    v_count integer := 0;
    u record;
begin
    select * into l from lost_pets where id = p_listing_id;
    if not found or l.user_id <> auth.uid() or l.status <> 'active' then raise exception 'İlan bulunamadı.'; end if;
    v_old := l.notify_radius_km;
    if v_new <= v_old then return 0; end if;
    if l.latitude is not null then
        for u in
            select p.id from profiles p
            where p.lost_alerts_enabled and p.alert_lat is not null and p.id <> l.user_id
              and km_between(l.latitude, l.longitude, p.alert_lat, p.alert_lng) > v_old
              and km_between(l.latitude, l.longitude, p.alert_lat, p.alert_lng) <= v_new
        loop
            perform notify_user(u.id, 'lost', 'Yakınında kayıp ' || coalesce(nullif(l.pet_name, ''), 'bir dost'),
                coalesce(l.location_text, 'Yakınında') || ' · ilana bakıp gördüysen haber ver.', l.user_id, l.id::text);
            v_count := v_count + 1;
        end loop;
    end if;
    update lost_pets set notify_radius_km = v_new, notified_count = notified_count + v_count where id = l.id;
    return v_count;
end;
$$;
revoke execute on function public.expand_lost_listing_radius(uuid, integer) from public;
grant execute on function public.expand_lost_listing_radius(uuid, integer) to authenticated;

-- 4) Görüldü bildirimi (giriş gerekmez; künyedeki gibi) -----------------------------------------------
alter table public.pet_sightings
    add column if not exists seen_at timestamptz,
    add column if not exists photo_url text,
    add column if not exists contact text;
alter table public.pet_sightings alter column reporter_id drop not null;

drop policy if exists "Allow public read access for pet_sightings" on public.pet_sightings;
drop policy if exists "Allow insert for authenticated users for pet_sightings" on public.pet_sightings;
drop policy if exists "Sightings: listing owner or reporter reads" on public.pet_sightings;
create policy "Sightings: listing owner or reporter reads" on public.pet_sightings for select to authenticated
    using (reporter_id = auth.uid() or exists (select 1 from lost_pets l where l.id = pet_sightings.lost_pet_id and l.user_id = auth.uid()));
revoke all on public.pet_sightings from anon, authenticated;
grant select on public.pet_sightings to authenticated;

create or replace function public.submit_sighting(p_listing_id uuid, p_lat double precision, p_lng double precision,
                                                 p_seen_at timestamptz, p_note text, p_photo_url text, p_contact text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
    l public.lost_pets;
    v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
    select * into l from lost_pets where id = p_listing_id;
    if not found or l.status <> 'active' then raise exception 'Bu ilan artık yayında değil.'; end if;
    if l.user_id = auth.uid() then raise exception 'Kendi ilanına görülme bildirimi gönderemezsin.'; end if;
    if p_lat is null or p_lng is null then raise exception 'Nerede gördüğünü haritada işaretle.'; end if;
    if char_length(coalesce(v_note, '')) > 500 or char_length(coalesce(p_contact, '')) > 100 then raise exception 'Not çok uzun.'; end if;
    if p_seen_at is not null and p_seen_at > now() + interval '5 minutes' then raise exception 'Görülme zamanı ileri bir tarih olamaz.'; end if;
    if (select count(*) from pet_sightings where lost_pet_id = p_listing_id and created_at > now() - interval '10 minutes') >= 10 then
        raise exception 'Çok fazla bildirim gönderildi, birkaç dakika sonra tekrar dene.';
    end if;
    insert into pet_sightings (lost_pet_id, reporter_id, description, latitude, longitude, seen_at, photo_url, contact)
    values (p_listing_id, auth.uid(), v_note, p_lat, p_lng, coalesce(p_seen_at, now()), nullif(p_photo_url, ''), nullif(trim(coalesce(p_contact, '')), ''));
    perform notify_user(l.user_id, 'sos',
        case when l.kind = 'lost' then coalesce(l.pet_name, 'İlanın') || ' görüldü' else 'Bulduğun dostun için bir haber var' end,
        coalesce(v_note, 'Biri haritada nerede gördüğünü işaretledi.'), auth.uid(), l.id::text);
end;
$$;
revoke execute on function public.submit_sighting(uuid, double precision, double precision, timestamptz, text, text, text) from public;
grant execute on function public.submit_sighting(uuid, double precision, double precision, timestamptz, text, text, text) to anon, authenticated;

-- 5) Eşleştirme: karşı türden (kayıp ↔ bulunan), aynı tür, 10 km ve ±30 gün içindeki yayındaki ilanlar ----
create or replace function public.get_listing_matches(p_listing_id uuid)
returns setof public.lost_pet_cards language sql stable security definer set search_path = public as $$
    select c.* from lost_pets l
    join lost_pets m on m.kind <> l.kind and m.status = 'active' and m.pet_type = l.pet_type and m.id <> l.id
         and m.latitude is not null and l.latitude is not null
         and km_between(l.latitude, l.longitude, m.latitude, m.longitude) <= 10
         and abs(extract(epoch from (coalesce(m.last_seen_date, m.created_at) - coalesce(l.last_seen_date, l.created_at)))) <= 30 * 86400
    join lost_pet_cards c on c.id = m.id
    where l.id = p_listing_id
    order by km_between(l.latitude, l.longitude, m.latitude, m.longitude)
    limit 10;
$$;
revoke execute on function public.get_listing_matches(uuid) from public;
grant execute on function public.get_listing_matches(uuid) to authenticated;

-- 6) Sayaçlar ----------------------------------------------------------------------------------------
create or replace function public.record_listing_event(p_listing_id uuid, p_event text)
returns void language sql volatile security definer set search_path = public as $$
    -- Görüntülenme ilan sahibinin kendi açışını saymaz; paylaşım herkesinkini sayar.
    update lost_pets set
        view_count = view_count + (p_event = 'view' and user_id is distinct from auth.uid())::integer,
        share_count = share_count + (p_event = 'share')::integer
    where id = p_listing_id and status = 'active';
$$;
revoke execute on function public.record_listing_event(uuid, text) from public;
grant execute on function public.record_listing_event(uuid, text) to anon, authenticated;

-- 7) Kavuştuk / ilanı kapat ---------------------------------------------------------------------------
create or replace function public.resolve_lost_listing(p_listing_id uuid, p_resolution text, p_thank_helpers boolean)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
    l public.lost_pets;
    r record;
begin
    select * into l from lost_pets where id = p_listing_id;
    if not found or l.user_id <> auth.uid() then raise exception 'İlan bulunamadı.'; end if;
    if p_resolution not in ('reunited', 'closed') then raise exception 'Geçersiz sonuç.'; end if;
    update lost_pets set status = 'resolved', resolved_at = now(), resolution = p_resolution where id = l.id;
    if l.pet_id is not null then
        update pets set is_lost = false where id = l.pet_id and owner_id = auth.uid();
    end if;
    if p_thank_helpers and p_resolution = 'reunited' then
        for r in select distinct reporter_id from pet_sightings where lost_pet_id = l.id and reporter_id is not null loop
            perform notify_user(r.reporter_id, 'lost', coalesce(l.pet_name, 'Dostumuz') || ' evine kavuştu',
                'Haber verdiğin için teşekkürler, yardımın çok değerliydi.', l.user_id, l.id::text);
        end loop;
    end if;
end;
$$;
revoke execute on function public.resolve_lost_listing(uuid, text, boolean) from public;
grant execute on function public.resolve_lost_listing(uuid, text, boolean) to authenticated;

-- İlan sahibi için istatistik: görülme, mesaj.
create or replace function public.get_listing_owner_stats(p_listing_id uuid)
returns table (views integer, sightings integer, messages integer, shares integer, notified integer)
language sql stable security definer set search_path = public as $$
    select l.view_count, (select count(*)::integer from pet_sightings s where s.lost_pet_id = l.id),
           (select count(*)::integer from conversations c where c.associated_ad_id = l.id),
           l.share_count, l.notified_count
    from lost_pets l where l.id = p_listing_id and l.user_id = auth.uid();
$$;
revoke execute on function public.get_listing_owner_stats(uuid) from public;
grant execute on function public.get_listing_owner_stats(uuid) to authenticated;

-- 8) Görülme bildirimi ayrı bildirim türü: 'lost_sighting' (e-postayla da gider, ilan yönetimini açar).
-- (Canlıda ayrı migration olarak uygulandı: lost_sighting_notification_type — notify_user'a 'lost_sighting'
--  e-posta dalı eklendi, submit_sighting bu türü kullanır.)
