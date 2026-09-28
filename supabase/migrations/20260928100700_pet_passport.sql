-- Pet Pasaportu (design-reference/passport-final): kimlik alanları, tek acil bilgi kaydı,
-- sahibin seçtiği bölümlerle süreli paylaşım bağlantısı ve künyeyi bulan kişinin gerçek bildirimi.

-- 1) Kimlik: doğum tarihi ve renk hiçbir yerde saklanmıyordu (formda girilip kayboluyordu).
alter table public.pets
    add column if not exists birth_date date,
    add column if not exists color text,
    add column if not exists petvet_no text,
    add column if not exists passport_no text;

update public.pets
set birth_date = (sos_settings->>'birthday')::date
where birth_date is null and sos_settings->>'birthday' ~ '^\d{4}-\d{2}-\d{2}$';

update public.pets
set color = nullif(trim(sos_settings->>'color'), '')
where color is null and coalesce(trim(sos_settings->>'color'), '') <> '';

create sequence if not exists public.pet_passport_seq;

with ordered as (
    select id, created_at, row_number() over (order by created_at, id) as rn
    from public.pets where passport_no is null
)
update public.pets p
set passport_no = 'MOF-' || to_char(coalesce(o.created_at, now()) at time zone 'Europe/Istanbul', 'YYYY')
                  || '-' || lpad(o.rn::text, 6, '0')
from ordered o where p.id = o.id;

select setval('public.pet_passport_seq', greatest((select count(*) from public.pets), 1));

create unique index if not exists pets_passport_no_key on public.pets (passport_no);

-- Pasaport numarasını sunucu verir, sonradan değiştirilemez.
create or replace function public.pets_passport_no_guard()
returns trigger language plpgsql set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        new.passport_no := 'MOF-' || to_char(now() at time zone 'Europe/Istanbul', 'YYYY')
                           || '-' || lpad(nextval('public.pet_passport_seq')::text, 6, '0');
    else
        new.passport_no := old.passport_no;
    end if;
    return new;
end;
$$;

drop trigger if exists pets_passport_no_guard on public.pets;
create trigger pets_passport_no_guard before insert or update of passport_no on public.pets
for each row execute function public.pets_passport_no_guard();

-- 2) Acil bilgiler tek kayıtta: serbest sağlık notu + acil iletişim kişileri.
alter table public.pet_health_profile
    add column if not exists notes text,
    add column if not exists contact_name text,
    add column if not exists contact_phone text,
    add column if not exists alt_contact_name text,
    add column if not exists alt_contact_phone text;

-- Eski iki ayrı alan (hayvan ayarlarındaki "Sağlık Notları", kayıp merkezindeki "kritik sağlık notu")
-- kayıpsız olarak buraya taşınır; metin tahminle alerji/hastalık diye bölünmez.
insert into public.pet_health_profile (pet_id, notes)
select p.id,
       nullif(concat_ws(E'\n',
           nullif(trim(p.health_notes), ''),
           case when coalesce(trim(p.sos_settings->>'critical_health_note'), '') not in ('', coalesce(trim(p.health_notes), ''))
                then trim(p.sos_settings->>'critical_health_note') end), '')
from public.pets p
where coalesce(trim(p.health_notes), '') <> '' or coalesce(trim(p.sos_settings->>'critical_health_note'), '') <> ''
on conflict (pet_id) do update set notes = coalesce(public.pet_health_profile.notes, excluded.notes);

drop function if exists public.get_public_emergency_info(uuid, text);
create function public.get_public_emergency_info(p_pet_id uuid, p_context text)
returns table (allergies text[], chronic_conditions text[], medications text[], blood_type text,
               vet_name text, vet_phone text, notes text, contact_name text, contact_phone text,
               alt_contact_name text, alt_contact_phone text)
language sql stable security definer set search_path = public as $$
    select hp.allergies, hp.chronic_conditions,
           coalesce((select array_agg(m.name order by m.name) from medications m
                     where m.pet_id = hp.pet_id and m.is_active
                       and (m.end_date is null or m.end_date >= (wall_now())::date)), '{}'),
           hp.blood_type, hp.primary_vet_name, hp.primary_vet_phone, hp.notes,
           hp.contact_name, hp.contact_phone, hp.alt_contact_name, hp.alt_contact_phone
    from pet_health_profile hp
    where hp.pet_id = p_pet_id
      and ((p_context = 'lost' and hp.show_on_lost) or (p_context = 'qr' and hp.show_on_qr));
$$;
revoke execute on function public.get_public_emergency_info(uuid, text) from public;
grant execute on function public.get_public_emergency_info(uuid, text) to anon, authenticated;

-- 3) Paylaşım bağlantısı: sahip bölümleri seçer, bağlantı en fazla 31 gün geçerli, istediği an kapatılır.
create table if not exists public.pet_share_links (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
    sections text[] not null,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    view_count integer not null default 0,
    last_viewed_at timestamptz,
    created_at timestamptz not null default now(),
    constraint pet_share_links_sections_check check (
        cardinality(sections) > 0
        and sections <@ array['identity','vaccines','parasites','medications','visits','weights','emergency','documents']::text[]),
    constraint pet_share_links_expiry_check check (expires_at > created_at and expires_at <= created_at + interval '31 days')
);
create index if not exists pet_share_links_pet_idx on public.pet_share_links (pet_id, created_at desc);

alter table public.pet_share_links enable row level security;
drop policy if exists "Share links: owner reads" on public.pet_share_links;
drop policy if exists "Share links: owner creates" on public.pet_share_links;
drop policy if exists "Share links: owner revokes" on public.pet_share_links;
drop policy if exists "Share links: owner deletes" on public.pet_share_links;
create policy "Share links: owner reads" on public.pet_share_links for select to authenticated
    using (owner_id = auth.uid());
create policy "Share links: owner creates" on public.pet_share_links for insert to authenticated
    with check (owner_id = auth.uid() and public.owns_pet(pet_id));
create policy "Share links: owner revokes" on public.pet_share_links for update to authenticated
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Share links: owner deletes" on public.pet_share_links for delete to authenticated
    using (owner_id = auth.uid());
revoke all on public.pet_share_links from anon, authenticated;
grant select, insert, delete on public.pet_share_links to authenticated;
grant update (revoked_at) on public.pet_share_links to authenticated;

create or replace function public.get_shared_passport(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
    l public.pet_share_links;
    p public.pets;
    sp text;
    r jsonb;
begin
    select * into l from pet_share_links
    where token = p_token and revoked_at is null and expires_at > now();
    if not found then return null; end if;

    update pet_share_links set view_count = view_count + 1, last_viewed_at = now() where id = l.id;
    select * into p from pets where id = l.pet_id;
    if not found then return null; end if;

    sp := case when lower(coalesce(p.type, '')) in ('cat', 'kedi') then 'cat'
               when lower(coalesce(p.type, '')) in ('dog', 'köpek', 'kopek') then 'dog' else 'other' end;

    r := jsonb_build_object(
        'sections', to_jsonb(l.sections),
        'expires_at', l.expires_at,
        'species', sp,
        'pet', jsonb_build_object('name', p.name, 'type', p.type, 'breed', p.breed,
                                  'avatar_url', p.avatar_url, 'passport_no', p.passport_no));

    if 'identity' = any(l.sections) then
        r := r || jsonb_build_object('identity', jsonb_build_object(
            'gender', p.gender, 'birth_date', p.birth_date, 'age', p.age, 'color', p.color,
            'microchip_no', p.microchip_no, 'petvet_no', p.petvet_no, 'is_neutered', p.is_neutered));
    end if;
    if 'vaccines' = any(l.sections) then
        r := r || jsonb_build_object(
            'vaccines', coalesce((select jsonb_agg(to_jsonb(v)) from vaccines v where v.pet_id = p.id), '[]'::jsonb),
            'definitions', coalesce((select jsonb_agg(to_jsonb(d) order by d.sort) from vaccine_definitions d where d.species = sp), '[]'::jsonb));
    end if;
    if 'parasites' = any(l.sections) then
        r := r || jsonb_build_object('parasites',
            coalesce((select jsonb_agg(to_jsonb(t)) from parasite_treatments t where t.pet_id = p.id), '[]'::jsonb));
    end if;
    if 'medications' = any(l.sections) then
        r := r || jsonb_build_object('medications',
            coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc) from medications m where m.pet_id = p.id), '[]'::jsonb));
    end if;
    if 'visits' = any(l.sections) then
        r := r || jsonb_build_object('visits', coalesce((
            select jsonb_agg(to_jsonb(mr) || jsonb_build_object(
                       'clinic_name', coalesce(pr.business_name, pr.full_name, mr.external_clinic_name))
                   order by mr.created_at desc)
            from medical_records mr
            left join profiles pr on pr.id::text = mr.clinic_id
            where mr.pet_id = p.id), '[]'::jsonb));
    end if;
    if 'weights' = any(l.sections) then
        r := r || jsonb_build_object('weights', coalesce((
            select jsonb_agg(to_jsonb(w) order by w.measured_on) from pet_weight_logs w where w.pet_id = p.id), '[]'::jsonb));
    end if;
    if 'emergency' = any(l.sections) then
        r := r || jsonb_build_object('emergency', (
            select jsonb_build_object('allergies', hp.allergies, 'chronic_conditions', hp.chronic_conditions,
                                      'blood_type', hp.blood_type, 'notes', hp.notes,
                                      'vet_name', hp.primary_vet_name, 'vet_phone', hp.primary_vet_phone,
                                      'contact_name', hp.contact_name, 'contact_phone', hp.contact_phone)
            from pet_health_profile hp where hp.pet_id = p.id));
    end if;
    if 'documents' = any(l.sections) then
        r := r || jsonb_build_object('documents', coalesce((
            select jsonb_agg(jsonb_build_object('id', d.id, 'category', d.category, 'title', d.title,
                                                'mime_type', d.mime_type, 'size_bytes', d.size_bytes, 'doc_date', d.doc_date)
                             order by d.doc_date desc)
            from pet_documents d where d.pet_id = p.id), '[]'::jsonb));
    end if;
    return r;
end;
$$;
revoke execute on function public.get_shared_passport(text) from public;
grant execute on function public.get_shared_passport(text) to anon, authenticated;

-- 4) Künye: kayıp hayvanı bulan kişinin görebileceği bilgiler (sadece gerekli olanlar).
create or replace function public.get_pet_tag_info(p_pet_id uuid)
returns table (pet_name text, species text, breed text, gender text, age text, avatar_url text,
               is_lost boolean, finder_message text, reward_amount numeric, owner_phone text)
language sql stable security definer set search_path = public as $$
    select p.name, p.type, p.breed, p.gender, p.age, p.avatar_url,
           coalesce(p.is_lost, false),
           case when p.is_lost then nullif(trim(p.sos_settings->>'finder_message'), '') end,
           case when p.is_lost and coalesce((p.sos_settings->>'reward_enabled')::boolean, false)
                then nullif(p.sos_settings->>'reward_amount', '')::numeric end,
           case when p.is_lost and not coalesce((p.sos_settings->>'secure_proxy_only')::boolean, false)
                then nullif(trim(coalesce(p.sos_settings->>'emergency_sms_number', p.sos_settings->'owner'->>'phone')), '') end
    from pets p where p.id = p_pet_id;
$$;
revoke execute on function public.get_pet_tag_info(uuid) from public;
grant execute on function public.get_pet_tag_info(uuid) to anon, authenticated;

create table if not exists public.pet_tag_reports (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    message text check (char_length(message) <= 500),
    contact text check (char_length(contact) <= 100),
    latitude double precision,
    longitude double precision,
    created_at timestamptz not null default now()
);
create index if not exists pet_tag_reports_pet_idx on public.pet_tag_reports (pet_id, created_at desc);
alter table public.pet_tag_reports enable row level security;
drop policy if exists "Tag reports: owner reads" on public.pet_tag_reports;
drop policy if exists "Tag reports: owner deletes" on public.pet_tag_reports;
create policy "Tag reports: owner reads" on public.pet_tag_reports for select to authenticated
    using (public.owns_pet(pet_id));
create policy "Tag reports: owner deletes" on public.pet_tag_reports for delete to authenticated
    using (public.owns_pet(pet_id));
revoke all on public.pet_tag_reports from anon, authenticated;
grant select, delete on public.pet_tag_reports to authenticated;

create or replace function public.submit_tag_report(p_pet_id uuid, p_message text, p_contact text,
                                                    p_lat double precision, p_lng double precision)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
    v_pet public.pets;
    v_msg text := nullif(trim(coalesce(p_message, '')), '');
    v_contact text := nullif(trim(coalesce(p_contact, '')), '');
begin
    select * into v_pet from pets where id = p_pet_id;
    if not found or not coalesce(v_pet.is_lost, false) then
        raise exception 'Bu künye için şu an kayıp bildirimi açık değil.';
    end if;
    if v_msg is null and (p_lat is null or p_lng is null) then
        raise exception 'Bir mesaj yaz ya da konumunu paylaş.';
    end if;
    if char_length(coalesce(v_msg, '')) > 500 or char_length(coalesce(v_contact, '')) > 100 then
        raise exception 'Mesaj çok uzun.';
    end if;
    -- Kötüye kullanıma karşı: bir künyeye 10 dakikada en fazla 5 bildirim.
    if (select count(*) from pet_tag_reports where pet_id = p_pet_id and created_at > now() - interval '10 minutes') >= 5 then
        raise exception 'Çok fazla bildirim gönderildi, birkaç dakika sonra tekrar dene.';
    end if;
    insert into pet_tag_reports (pet_id, message, contact, latitude, longitude)
    values (p_pet_id, v_msg, v_contact, p_lat, p_lng);
    perform notify_user(v_pet.owner_id, 'sos', v_pet.name || ' için bir haber var',
        coalesce(v_msg, 'Künyeyi okutan biri konumunu paylaştı.'), null, p_pet_id::text);
end;
$$;
revoke execute on function public.submit_tag_report(uuid, text, text, double precision, double precision) from public;
grant execute on function public.submit_tag_report(uuid, text, text, double precision, double precision) to anon, authenticated;

-- Kayıp hayvan haberi e-postayla da gider.
create or replace function public.notify_user(p_user_id uuid, p_type text, p_title text, p_content text,
                                              p_actor_id uuid, p_entity_id text)
returns void language plpgsql security definer set search_path = public as $$
declare v_is_business boolean;
begin
  if p_user_id is null or p_user_id = p_actor_id then return; end if;
  insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
  values (p_user_id, p_type, p_title, p_content, p_actor_id, p_entity_id, false);
  if p_type in ('appointment', 'order', 'health', 'sos') then
    select role = 'business' into v_is_business from profiles where id = p_user_id;
    perform enqueue_email(p_user_id, 'Moffi · ' || p_title, p_title, p_content,
      case
        when p_type = 'health' then '/health'
        when p_type = 'sos' then '/pasaport'
        when p_type = 'appointment' and coalesce(v_is_business, false) then '/business/calendar'
        when p_type = 'appointment' then '/vet'
        when coalesce(v_is_business, false) then '/business/orders'
        else '/petshop'
      end);
  end if;
end;
$$;

-- 5) Doğrulama kodu (eski karne QR'ı): aşı bilgisi artık sadece sahip "QR'da göster"i açtıysa döner.
CREATE OR REPLACE FUNCTION public.get_pet_verification_info(p_pet_id uuid)
 RETURNS TABLE(pet_name text, species text, breed text, avatar_url text, is_vaccination_current boolean, latest_vaccines json, is_lost boolean, finder_message text, reward_enabled boolean, reward_amount numeric, owner_phone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_share BOOLEAN;
    v_is_current BOOLEAN := null;
    v_latest_vaccines JSON := null;
BEGIN
    SELECT coalesce(hp.show_on_qr, false) INTO v_share FROM public.pet_health_profile hp WHERE hp.pet_id = p_pet_id;

    IF coalesce(v_share, false) THEN
        SELECT NOT EXISTS (
            SELECT 1 FROM (
                SELECT DISTINCT ON (coalesce(vs.definition_id, lower(vs.name)))
                       vs.next_due_date
                FROM public.vaccines vs
                WHERE vs.pet_id = p_pet_id
                ORDER BY coalesce(vs.definition_id, lower(vs.name)),
                         (vs.status = 'completed') DESC, coalesce(vs.date_administered, vs.created_at) DESC
            ) latest
            WHERE latest.next_due_date IS NOT NULL AND latest.next_due_date::date < (wall_now())::date
        ) INTO v_is_current;

        SELECT COALESCE(json_agg(json_build_object('name', vs.name,
                        'date', to_char(vs.date_administered at time zone 'Europe/Istanbul', 'DD.MM.YYYY'))), '[]'::json)
        INTO v_latest_vaccines
        FROM (
            SELECT name, date_administered FROM public.vaccines
            WHERE pet_id = p_pet_id AND status = 'completed' AND date_administered IS NOT NULL
            ORDER BY date_administered DESC LIMIT 3
        ) vs;
    END IF;

    RETURN QUERY
    SELECT t.pet_name, t.species, t.breed, t.avatar_url, v_is_current, v_latest_vaccines,
           t.is_lost, t.finder_message, t.reward_amount IS NOT NULL, t.reward_amount, t.owner_phone
    FROM public.get_pet_tag_info(p_pet_id) t;
END;
$function$;
revoke execute on function public.get_pet_verification_info(uuid) from public;
grant execute on function public.get_pet_verification_info(uuid) to anon, authenticated;
