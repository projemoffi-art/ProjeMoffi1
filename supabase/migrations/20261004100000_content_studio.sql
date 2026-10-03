-- İçerik Stüdyosu (2026-10-04, Baran onaylı). Ana sayfa hikâyeleri ve "Moffi'den İlham" kartı için TEK içerik kaydı.
-- Kanallar:
--   moffi        → "Moffi" hikâyesi (duyuru, rehber, kampanya). Süper admin hazırlar, doğrudan yayına alır.
--   inspiration  → "Moffi'den İlham" kartı (fotoğraf + söz). Süper admin.
--   vet          → "Veteriner Önerisi" hikâyesi. Klinik gönderir, admin ONAYLAR; yalnızca kliniğin çevresine; en fazla 14 gün.
--   deal         → "Fırsatlar" hikâyesi. İşletmenin mevcut kampanyası (clinic_campaigns) öne çıkarılır; admin ONAYLAR;
--                  çevresine gösterilir, "Reklam" etiketiyle; en fazla 30 gün.
-- Tablolara istemcinin doğrudan erişimi yok (RLS açık, politika yok); her şey aşağıdaki fonksiyonlarla.
-- İlişki kuralları (silinince birlikte silinme) ayrı dosyada: 20261004100100_content_studio_fk_MANUAL_sql_editor.sql

create table if not exists public.content_items (
    id uuid primary key default gen_random_uuid(),
    channel text not null check (channel in ('moffi', 'inspiration', 'vet', 'deal')),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'archived')),
    title text not null default '' check (char_length(title) <= 90),
    body text check (char_length(body) <= 600),
    media_url text,
    cta_label text check (char_length(cta_label) <= 30),
    cta_url text check (cta_url is null or cta_url ~ '^(/|https://)'),
    starts_at timestamptz not null default now(),
    ends_at timestamptz,
    target_species text not null default 'all' check (target_species in ('all', 'dog', 'cat')),
    business_id uuid,
    campaign_id uuid,
    radius_km integer not null default 25 check (radius_km between 1 and 200),
    priority integer not null default 0,
    created_by uuid,
    reviewed_by uuid,
    reviewed_at timestamptz,
    reject_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint content_items_business_channels check ((channel in ('vet', 'deal')) = (business_id is not null)),
    constraint content_items_deal_campaign check ((channel = 'deal') = (campaign_id is not null)),
    constraint content_items_window check (ends_at is null or ends_at > starts_at)
);
create index if not exists content_items_feed_idx on public.content_items (status, channel, starts_at desc);
create index if not exists content_items_business_idx on public.content_items (business_id);

create table if not exists public.content_events (
    content_id uuid not null,
    user_id uuid not null,
    kind text not null check (kind in ('view', 'tap')),
    created_at timestamptz not null default now(),
    primary key (content_id, user_id, kind)
);

alter table public.content_items enable row level security;
alter table public.content_events enable row level security;
revoke all on public.content_items from anon, authenticated;
revoke all on public.content_events from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Kuş uçuşu mesafe (km)
create or replace function public.km_between(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable set search_path to 'public' as $$
    select 6371 * 2 * asin(sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2) +
        cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ));
$$;

-- ── Kullanıcı akışı ──────────────────────────────────────────────────────────────────────────────────────
-- p_lat/p_lng: kullanıcının (yaklaşık da olabilir) konumu; yoksa bölgesel kanallar (vet, deal) gelmez.
-- p_species: kullanıcının hayvan türleri ('dog','cat'); null ise tür süzmesi yok.
create or replace function public.content_feed(p_lat double precision default null, p_lng double precision default null, p_species text[] default null)
returns table (
    id uuid, channel text, title text, body text, media_url text, cta_label text, cta_url text,
    coupon_code text, discount text, starts_at timestamptz, ends_at timestamptz,
    business_id uuid, business_name text, business_logo text, distance_km double precision, seen boolean
)
language sql stable security definer set search_path to 'public' as $$
    select c.id, c.channel,
           case when c.channel = 'deal' then cc.title else c.title end,
           case when c.channel = 'deal' then cc.description else c.body end,
           coalesce(c.media_url, cc.media_url),
           case when c.channel = 'deal' then 'Kliniği gör' else c.cta_label end,
           case when c.channel in ('vet', 'deal') then '/vet?clinicId=' || c.business_id::text else c.cta_url end,
           case when c.channel = 'deal' then cc.coupon_code end,
           case when c.channel = 'deal' then cc.discount_value end,
           c.starts_at,
           least(c.ends_at, coalesce(cc.ends_at, cc.expires_at, c.ends_at)),
           c.business_id, b.name::text, b.logo_url,
           case when b.lat is not null and p_lat is not null then km_between(p_lat, p_lng, b.lat::double precision, b.lng::double precision) end,
           exists (select 1 from content_events e where e.content_id = c.id and e.user_id = auth.uid() and e.kind = 'view')
      from content_items c
      left join clinic_campaigns cc on cc.id = c.campaign_id
      left join businesses b on b.id = c.business_id
     where auth.uid() is not null
       and c.status = 'approved'
       and c.starts_at <= now()
       and (c.ends_at is null or c.ends_at > now())
       and (c.target_species = 'all' or p_species is null or c.target_species = any (p_species))
       and (c.channel <> 'deal' or (cc.id is not null and coalesce(cc.status, 'active') = 'active'
            and coalesce(cc.ends_at, cc.expires_at, now() + interval '1 day') > now()))
       and (c.channel not in ('vet', 'deal') or (
            b.approved and b.lat is not null and p_lat is not null
            and km_between(p_lat, p_lng, b.lat::double precision, b.lng::double precision) <= c.radius_km))
     order by c.priority desc, c.starts_at desc
     limit 60;
$$;

create or replace function public.content_track(p_id uuid, p_kind text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if auth.uid() is null or p_kind not in ('view', 'tap') then return; end if;
    insert into content_events (content_id, user_id, kind) values (p_id, auth.uid(), p_kind)
    on conflict do nothing;
end;
$$;

-- ── İşletme ──────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.content_submit_vet(p_business uuid, p_title text, p_body text, p_media_url text, p_species text default 'all', p_days integer default 14)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_type text; v_ok boolean;
begin
    if not can_manage_business(p_business) then raise exception 'Bu işletme için yetkin yok'; end if;
    select business_type, approved into v_type, v_ok from businesses where id = p_business;
    if v_type is distinct from 'vet' then raise exception 'Veteriner önerisini yalnızca veteriner klinikleri gönderebilir'; end if;
    if not coalesce(v_ok, false) then raise exception 'İşletme onaylandıktan sonra öneri gönderebilirsin'; end if;
    if char_length(coalesce(trim(p_title), '')) < 3 or char_length(coalesce(trim(p_body), '')) < 20 then
        raise exception 'Başlık en az 3, metin en az 20 karakter olmalı';
    end if;
    if exists (select 1 from content_items where business_id = p_business and channel = 'vet'
               and status in ('pending', 'approved') and (ends_at is null or ends_at > now())) then
        raise exception 'Aynı anda yalnızca bir aktif ya da onay bekleyen önerin olabilir';
    end if;
    insert into content_items (channel, status, title, body, media_url, target_species, business_id, starts_at, ends_at, created_by)
    values ('vet', 'pending', trim(p_title), trim(p_body), nullif(p_media_url, ''),
            coalesce(nullif(p_species, ''), 'all'), p_business, now(), now() + make_interval(days => greatest(1, least(coalesce(p_days, 14), 14))), auth.uid())
    returning id into v_id;
    return v_id;
end;
$$;

create or replace function public.content_promote_campaign(p_campaign uuid, p_days integer default 30)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_business uuid; v_ok boolean; v_end timestamptz; v_species text;
begin
    select clinic_id, coalesce(ends_at, expires_at), coalesce(nullif(target_pet_type, ''), 'all')
      into v_business, v_end, v_species from clinic_campaigns where id = p_campaign;
    if v_business is null then raise exception 'Kampanya bulunamadı'; end if;
    if not can_manage_business(v_business) then raise exception 'Bu işletme için yetkin yok'; end if;
    select approved into v_ok from businesses where id = v_business;
    if not coalesce(v_ok, false) then raise exception 'İşletme onaylandıktan sonra öne çıkarabilirsin'; end if;
    if v_end is not null and v_end <= now() then raise exception 'Süresi dolmuş kampanya öne çıkarılamaz'; end if;
    if exists (select 1 from content_items where campaign_id = p_campaign and status in ('pending', 'approved')
               and (ends_at is null or ends_at > now())) then
        raise exception 'Bu kampanya zaten onayda ya da yayında';
    end if;
    if (select count(*) from content_items where business_id = v_business and channel = 'deal'
        and status in ('pending', 'approved') and (ends_at is null or ends_at > now())) >= 3 then
        raise exception 'Aynı anda en fazla 3 kampanya öne çıkarılabilir';
    end if;
    insert into content_items (channel, status, title, business_id, campaign_id, target_species, starts_at, ends_at, created_by)
    values ('deal', 'pending', '', v_business, p_campaign,
            case when v_species in ('dog', 'cat') then v_species else 'all' end,
            now(), least(coalesce(v_end, now() + interval '30 days'), now() + make_interval(days => greatest(1, least(coalesce(p_days, 30), 30)))),
            auth.uid())
    returning id into v_id;
    return v_id;
end;
$$;

create or replace function public.content_withdraw(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_business uuid;
begin
    select business_id into v_business from content_items where id = p_id;
    if v_business is null or not can_manage_business(v_business) then raise exception 'Bu içerik için yetkin yok'; end if;
    update content_items set status = 'archived', updated_at = now() where id = p_id;
end;
$$;

create or replace function public.content_my_items(p_business uuid)
returns table (id uuid, channel text, status text, title text, body text, media_url text, campaign_id uuid,
               starts_at timestamptz, ends_at timestamptz, reject_reason text, views bigint, taps bigint, created_at timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
begin
    if not is_business_member(p_business) then raise exception 'Bu işletme için yetkin yok'; end if;
    return query
    select c.id, c.channel, c.status,
           case when c.channel = 'deal' then cc.title else c.title end,
           case when c.channel = 'deal' then cc.description else c.body end,
           coalesce(c.media_url, cc.media_url), c.campaign_id, c.starts_at, c.ends_at, c.reject_reason,
           (select count(*) from content_events e where e.content_id = c.id and e.kind = 'view'),
           (select count(*) from content_events e where e.content_id = c.id and e.kind = 'tap'),
           c.created_at
      from content_items c left join clinic_campaigns cc on cc.id = c.campaign_id
     where c.business_id = p_business
     order by c.created_at desc
     limit 100;
end;
$$;

-- ── Süper admin ──────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.content_admin_list(p_status text default null)
returns table (id uuid, channel text, status text, title text, body text, media_url text, cta_label text, cta_url text,
               starts_at timestamptz, ends_at timestamptz, target_species text, priority integer, radius_km integer,
               business_id uuid, business_name text, coupon_code text, discount text, reject_reason text,
               views bigint, taps bigint, created_at timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    return query
    select c.id, c.channel, c.status,
           case when c.channel = 'deal' then cc.title else c.title end,
           case when c.channel = 'deal' then cc.description else c.body end,
           coalesce(c.media_url, cc.media_url), c.cta_label, c.cta_url, c.starts_at, c.ends_at, c.target_species, c.priority, c.radius_km,
           c.business_id, b.name::text, cc.coupon_code, cc.discount_value, c.reject_reason,
           (select count(*) from content_events e where e.content_id = c.id and e.kind = 'view'),
           (select count(*) from content_events e where e.content_id = c.id and e.kind = 'tap'),
           c.created_at
      from content_items c
      left join clinic_campaigns cc on cc.id = c.campaign_id
      left join businesses b on b.id = c.business_id
     where p_status is null or c.status = p_status
     order by (c.status = 'pending') desc, c.created_at desc
     limit 300;
end;
$$;

create or replace function public.content_admin_save(
    p_id uuid, p_channel text, p_title text, p_body text, p_media_url text, p_cta_label text, p_cta_url text,
    p_starts_at timestamptz, p_ends_at timestamptz, p_species text, p_priority integer)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    if p_channel not in ('moffi', 'inspiration') then raise exception 'Yönetici yalnızca Moffi ve İlham içeriği oluşturur'; end if;
    if char_length(coalesce(trim(p_title), '')) < 2 then raise exception 'Başlık gerekli'; end if;
    if coalesce(p_media_url, '') = '' then raise exception 'Görsel gerekli'; end if;
    if p_id is null then
        insert into content_items (channel, status, title, body, media_url, cta_label, cta_url, starts_at, ends_at, target_species, priority, created_by, reviewed_by, reviewed_at)
        values (p_channel, 'approved', trim(p_title), nullif(trim(coalesce(p_body, '')), ''), p_media_url, nullif(trim(coalesce(p_cta_label, '')), ''),
                nullif(trim(coalesce(p_cta_url, '')), ''), coalesce(p_starts_at, now()), p_ends_at, coalesce(nullif(p_species, ''), 'all'),
                coalesce(p_priority, 0), auth.uid(), auth.uid(), now())
        returning id into v_id;
    else
        update content_items set
            channel = p_channel, title = trim(p_title), body = nullif(trim(coalesce(p_body, '')), ''), media_url = p_media_url,
            cta_label = nullif(trim(coalesce(p_cta_label, '')), ''), cta_url = nullif(trim(coalesce(p_cta_url, '')), ''),
            starts_at = coalesce(p_starts_at, starts_at), ends_at = p_ends_at, target_species = coalesce(nullif(p_species, ''), 'all'),
            priority = coalesce(p_priority, 0), status = case when status = 'archived' then 'approved' else status end, updated_at = now()
        where id = p_id and channel in ('moffi', 'inspiration')
        returning id into v_id;
        if v_id is null then raise exception 'İçerik bulunamadı'; end if;
    end if;
    return v_id;
end;
$$;

create or replace function public.content_review(p_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_business uuid; v_channel text; v_title text;
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    if not p_approve and char_length(coalesce(trim(p_reason), '')) < 3 then raise exception 'Reddetme nedeni yaz'; end if;
    update content_items set status = case when p_approve then 'approved' else 'rejected' end,
           reject_reason = case when p_approve then null else trim(p_reason) end,
           reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
     where id = p_id and status = 'pending'
    returning business_id, channel into v_business, v_channel;
    if v_channel is null then raise exception 'Onay bekleyen içerik bulunamadı'; end if;
    if v_business is not null then
        v_title := case when v_channel = 'vet' then 'Veteriner önerin' else 'Öne çıkarma talebin' end;
        perform notify_business(v_business, null, 'biz_content_review',
            v_title || case when p_approve then ' yayında' else ' onaylanmadı' end,
            case when p_approve then 'Moffi ana sayfasında çevrendeki kullanıcılara gösteriliyor.' else 'Neden: ' || trim(p_reason) end,
            auth.uid(), p_id::text);
    end if;
end;
$$;

create or replace function public.content_archive(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    update content_items set status = 'archived', updated_at = now() where id = p_id;
end;
$$;

-- Yetkiler: yalnızca giriş yapmış kullanıcılar; fonksiyonlar kendi içinde rolü denetler.
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.content_feed(double precision, double precision, text[]) from public, anon;
revoke execute on function public.content_track(uuid, text) from public, anon;
revoke execute on function public.content_submit_vet(uuid, text, text, text, text, integer) from public, anon;
revoke execute on function public.content_promote_campaign(uuid, integer) from public, anon;
revoke execute on function public.content_withdraw(uuid) from public, anon;
revoke execute on function public.content_my_items(uuid) from public, anon;
revoke execute on function public.content_admin_list(text) from public, anon;
revoke execute on function public.content_admin_save(uuid, text, text, text, text, text, text, timestamptz, timestamptz, text, integer) from public, anon;
revoke execute on function public.content_review(uuid, boolean, text) from public, anon;
revoke execute on function public.content_archive(uuid) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.content_feed(double precision, double precision, text[]) to authenticated;
grant execute on function public.content_track(uuid, text) to authenticated;
grant execute on function public.content_submit_vet(uuid, text, text, text, text, integer) to authenticated;
grant execute on function public.content_promote_campaign(uuid, integer) to authenticated;
grant execute on function public.content_withdraw(uuid) to authenticated;
grant execute on function public.content_my_items(uuid) to authenticated;
grant execute on function public.content_admin_list(text) to authenticated;
grant execute on function public.content_admin_save(uuid, text, text, text, text, text, text, timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.content_review(uuid, boolean, text) to authenticated;
grant execute on function public.content_archive(uuid) to authenticated;
