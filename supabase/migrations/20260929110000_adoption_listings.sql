-- Faz 2 — Sahiplendirme (design-reference/community-final/sahiplendirme-reference.jpg).
-- İlan yaşam döngüsü (yayında → durduruldu → sahiplendirildi / kapatıldı), başvurular, favoriler,
-- yakın çevre bildirimi ve pasaport devri (eski sahip teklif eder, yeni sahip kabul eder).
-- Durum, sayaçlar ve başvuru akışı sadece sunucu fonksiyonlarıyla değişir.

-- 1) İlan alanları -------------------------------------------------------------------------------------
alter table public.adoption_pets
    add column if not exists pet_id uuid references public.pets(id) on delete set null,
    add column if not exists age_group text,
    add column if not exists vaccinated boolean not null default false,
    add column if not exists neutered boolean not null default false,
    add column if not exists microchipped boolean not null default false,
    add column if not exists health_unknown boolean not null default false,
    add column if not exists good_with_kids boolean not null default false,
    add column if not exists good_with_cats boolean not null default false,
    add column if not exists good_with_dogs boolean not null default false,
    add column if not exists good_with_others boolean not null default false,
    add column if not exists health_note text,
    add column if not exists latitude double precision,
    add column if not exists longitude double precision,
    add column if not exists contact_mode text not null default 'in_app',
    add column if not exists is_shelter boolean not null default false,
    add column if not exists notified_at timestamptz,
    add column if not exists notified_count integer not null default 0,
    add column if not exists view_count integer not null default 0,
    add column if not exists share_count integer not null default 0,
    add column if not exists adopted_at timestamptz,
    add column if not exists adopted_by uuid references auth.users(id) on delete set null,
    add column if not exists updated_at timestamptz not null default now();

-- Kullanılmayan eski alanlar: yapay zekâ denetimi (hiç çalışmadı), ilan sahibinin adı (profile_cards'tan gelir),
-- boş coğrafya kolonu (enlem/boylam kullanılıyor).
alter table public.adoption_pets
    drop column if exists moderation_result,
    drop column if exists moderation_passed,
    drop column if exists moderated_at,
    drop column if exists owner_name,
    drop column if exists location_point;

update public.adoption_pets set status = 'active' where status is null or status in ('available', 'pending');
update public.adoption_pets set pet_type = case
    when lower(pet_type) in ('cat', 'kedi') then 'cat' when lower(pet_type) in ('dog', 'köpek') then 'dog' else 'other' end;
alter table public.adoption_pets alter column status set default 'active';

alter table public.adoption_pets drop constraint if exists adoption_pets_status_check;
alter table public.adoption_pets add constraint adoption_pets_status_check check (status in ('active', 'paused', 'adopted', 'closed', 'removed'));
alter table public.adoption_pets drop constraint if exists adoption_pets_type_check;
alter table public.adoption_pets add constraint adoption_pets_type_check check (pet_type in ('dog', 'cat', 'other'));
alter table public.adoption_pets drop constraint if exists adoption_pets_age_group_check;
alter table public.adoption_pets add constraint adoption_pets_age_group_check check (age_group is null or age_group in ('baby', 'young', 'adult', 'senior'));
alter table public.adoption_pets drop constraint if exists adoption_pets_contact_mode_check;
alter table public.adoption_pets add constraint adoption_pets_contact_mode_check check (contact_mode in ('in_app', 'phone'));
alter table public.adoption_pets drop constraint if exists adoption_pets_text_check;
alter table public.adoption_pets add constraint adoption_pets_text_check check (
    char_length(coalesce(description, '')) <= 1000 and char_length(coalesce(health_note, '')) <= 300
    and char_length(coalesce(pet_name, '')) <= 60 and coalesce(cardinality(images), 0) <= 8);

create index if not exists adoption_pets_status_idx on public.adoption_pets (status, created_at desc);
create unique index if not exists adoption_pets_one_open_per_pet on public.adoption_pets (pet_id) where pet_id is not null and status in ('active', 'paused');

create or replace function public.is_approved_shelter(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from profiles where id = p_user and role = 'business'
                   and business_type = 'shelter' and coalesce(business_approved, false));
$$;
revoke execute on function public.is_approved_shelter(uuid) from public;
-- Aşağıdaki tetikleyici çağıranın yetkisiyle çalışır; sadece evet/hayır döndüğü için giriş yapmış kullanıcıya açık.
grant execute on function public.is_approved_shelter(uuid) to authenticated;

-- İstemciden gelen yazmaları süzer: sahiplik, sayaçlar, durum ve içerik kuralları.
create or replace function public.adoption_pets_guard()
returns trigger language plpgsql set search_path = public as $$
declare
    v_text text;
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'INSERT' then
            new.status := 'active';
            new.notified_at := null; new.notified_count := 0; new.view_count := 0; new.share_count := 0;
            new.adopted_at := null; new.adopted_by := null;
            if new.pet_id is not null and not exists (select 1 from pets where id = new.pet_id and owner_id = new.user_id) then
                raise exception 'Bu hayvan senin pasaportunda değil.';
            end if;
            if new.pet_id is not null and exists (select 1 from adoption_pets where pet_id = new.pet_id and status in ('active', 'paused')) then
                raise exception 'Bu hayvan için zaten yayında bir sahiplendirme ilanın var.';
            end if;
        else
            new.user_id := old.user_id; new.pet_id := old.pet_id; new.status := old.status;
            new.notified_at := old.notified_at; new.notified_count := old.notified_count;
            new.view_count := old.view_count; new.share_count := old.share_count;
            new.adopted_at := old.adopted_at; new.adopted_by := old.adopted_by; new.created_at := old.created_at;
            if old.status in ('adopted', 'closed', 'removed') then raise exception 'Kapanmış ilan düzenlenemez.'; end if;
        end if;
        new.is_shelter := coalesce(new.is_shelter, false) and is_approved_shelter(new.user_id);
        if new.contact_mode = 'phone' and (new.phone is null or new.phone !~ '^[0-9 +()-]{10,20}$') then
            raise exception 'Geçerli bir telefon numarası yaz ya da sadece uygulama içi mesajı seç.';
        end if;
        if new.contact_mode <> 'phone' then new.phone := null; end if;

        -- Moffi'de sahiplendirme ücretsizdir; satış, ücret ve dış iletişim bilgisi ilan metnine yazılamaz.
        v_text := lower(concat_ws(' ', new.pet_name, new.description, new.health_note, new.pet_breed, new.pet_age));
        if v_text ~ '(satılık|satılır|satıyorum|satış|fiyat[ıi]?\y|ücretli|ücret karşılığı|katkı payı|[0-9]+ ?(tl\y|₺)|iban|tr[0-9]{2} ?[0-9]{4})' then
            raise exception 'Moffi''de sahiplendirme ücretsizdir; ilanda satış, fiyat ya da ödeme bilgisi olamaz.';
        end if;
        if v_text ~ '(\+?90|0)?[ .-]?5[0-9]{2}[ .-]?[0-9]{3}[ .-]?[0-9]{2}[ .-]?[0-9]{2}' then
            raise exception 'Telefonu açıklamaya yazma; iletişim adımında "telefon numaramı göster"i seçebilirsin.';
        end if;
    end if;
    new.updated_at := now();
    return new;
end;
$$;
drop trigger if exists adoption_pets_guard on public.adoption_pets;
create trigger adoption_pets_guard before insert or update on public.adoption_pets
for each row execute function public.adoption_pets_guard();

-- Kurallar: aynı işi yapan 9 eski kural (4'ü koşulsuz okuma) yerine üç kural. Silme yok; ilan kapatılır.
drop policy if exists "Allow insert for authenticated users for adoption_pets" on public.adoption_pets;
drop policy if exists "Allow public read access" on public.adoption_pets;
drop policy if exists "Allow public read access for adoption_pets" on public.adoption_pets;
drop policy if exists "Allow update/delete for owners for adoption_pets" on public.adoption_pets;
drop policy if exists "Public adoption_pets are viewable by everyone" on public.adoption_pets;
drop policy if exists "Public read for adoptions" on public.adoption_pets;
drop policy if exists "Users can manage their own adoption ads" on public.adoption_pets;
drop policy if exists "Users insert adoptions" on public.adoption_pets;
drop policy if exists "Users update own adoptions" on public.adoption_pets;
drop policy if exists "Adoption: public reads open listings" on public.adoption_pets;
drop policy if exists "Adoption: owner inserts" on public.adoption_pets;
drop policy if exists "Adoption: owner updates" on public.adoption_pets;
create policy "Adoption: public reads open listings" on public.adoption_pets for select
    using (status in ('active', 'paused', 'adopted') or user_id = auth.uid() or get_my_role() = 'admin');
create policy "Adoption: owner inserts" on public.adoption_pets for insert to authenticated with check (user_id = auth.uid());
create policy "Adoption: owner updates" on public.adoption_pets for update to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Kolon yetkileri: telefon ve tam konum herkese kapalı (adoption_cards'tan okunur).
revoke all on public.adoption_pets from anon, authenticated;
grant select (id, user_id, pet_id, pet_name, pet_type, pet_breed, pet_age, age_group, gender, img_url, images,
              description, health_note, location_text, vaccinated, neutered, microchipped, health_unknown,
              good_with_kids, good_with_cats, good_with_dogs, good_with_others, contact_mode, is_shelter, status,
              notified_count, view_count, share_count, adopted_at, created_at, updated_at)
    on public.adoption_pets to anon, authenticated;
grant insert (user_id, pet_id, pet_name, pet_type, pet_breed, pet_age, age_group, gender, img_url, images, description,
              health_note, location_text, latitude, longitude, phone, vaccinated, neutered, microchipped, health_unknown,
              good_with_kids, good_with_cats, good_with_dogs, good_with_others, contact_mode, is_shelter)
    on public.adoption_pets to authenticated;
grant update (pet_name, pet_type, pet_breed, pet_age, age_group, gender, img_url, images, description,
              health_note, location_text, latitude, longitude, phone, vaccinated, neutered, microchipped, health_unknown,
              good_with_kids, good_with_cats, good_with_dogs, good_with_others, contact_mode, is_shelter)
    on public.adoption_pets to authenticated;

-- 2) Favoriler -------------------------------------------------------------------------------------------
create table if not exists public.adoption_favorites (
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    adoption_id uuid not null references public.adoption_pets(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, adoption_id)
);
alter table public.adoption_favorites enable row level security;
drop policy if exists "Adoption favorites: own" on public.adoption_favorites;
create policy "Adoption favorites: own" on public.adoption_favorites for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.adoption_favorites from anon, authenticated;
grant select, insert, delete on public.adoption_favorites to authenticated;

-- 3) Başvurular -------------------------------------------------------------------------------------------
create table if not exists public.adoption_applications (
    id uuid primary key default gen_random_uuid(),
    adoption_id uuid not null references public.adoption_pets(id) on delete cascade,
    applicant_id uuid not null references auth.users(id) on delete cascade,
    owner_id uuid not null references auth.users(id) on delete cascade,
    full_name text not null check (char_length(full_name) between 2 and 80),
    home_type text not null check (home_type in ('apartment', 'house', 'garden', 'other')),
    home_features text[] not null default '{}' check (cardinality(home_features) <= 8),
    household text[] not null default '{}' check (cardinality(household) <= 8),
    children_ages text check (char_length(children_ages) <= 80),
    experience text check (experience in ('none', 'past', 'current')),
    experience_note text check (char_length(experience_note) <= 200),
    reference_note text check (char_length(reference_note) <= 200),
    message text not null check (char_length(message) between 20 and 500),
    status text not null default 'pending' check (status in ('pending', 'interview', 'accepted', 'rejected', 'withdrawn')),
    interview_at timestamptz,
    interview_note text check (char_length(interview_note) <= 300),
    owner_note text check (char_length(owner_note) <= 300),
    decided_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create unique index if not exists adoption_applications_one_per_person
    on public.adoption_applications (adoption_id, applicant_id) where status <> 'withdrawn';
create index if not exists adoption_applications_owner_idx on public.adoption_applications (owner_id, created_at desc);
create index if not exists adoption_applications_applicant_idx on public.adoption_applications (applicant_id, created_at desc);
alter table public.adoption_applications enable row level security;
drop policy if exists "Adoption applications: applicant or owner reads" on public.adoption_applications;
create policy "Adoption applications: applicant or owner reads" on public.adoption_applications for select to authenticated
    using (applicant_id = auth.uid() or owner_id = auth.uid());
revoke all on public.adoption_applications from anon, authenticated;
grant select on public.adoption_applications to authenticated;

-- 4) Herkese açık ilan kartları (yaklaşık konum; telefon sadece izin verildiyse ve giriş yapmışsa) -------------
drop view if exists public.adoption_cards;
create view public.adoption_cards as
select a.id, a.user_id, a.pet_id, a.pet_name, a.pet_type, a.pet_breed, a.pet_age, a.age_group, a.gender,
       a.img_url, a.images, a.description, a.health_note, a.location_text,
       a.vaccinated, a.neutered, a.microchipped, a.health_unknown,
       a.good_with_kids, a.good_with_cats, a.good_with_dogs, a.good_with_others,
       a.contact_mode,
       case when a.user_id = auth.uid() or (a.contact_mode = 'phone' and a.status = 'active' and auth.uid() is not null) then a.phone end as contact_phone,
       a.is_shelter, a.status, a.notified_count, a.view_count, a.share_count, a.adopted_at, a.created_at, a.updated_at,
       case when a.user_id = auth.uid() then a.latitude else round((a.latitude / 0.003)::numeric) * 0.003 end as latitude,
       case when a.user_id = auth.uid() then a.longitude else round((a.longitude / 0.003)::numeric) * 0.003 end as longitude,
       coalesce(a.user_id = auth.uid(), false) as is_mine,
       exists (select 1 from adoption_favorites f where f.adoption_id = a.id and f.user_id = auth.uid()) as is_favorite,
       case when a.user_id = auth.uid() then
           (select count(*)::integer from adoption_applications x where x.adoption_id = a.id and x.status in ('pending', 'interview', 'accepted'))
       end as open_applications,
       (select x.id from adoption_applications x where x.adoption_id = a.id and x.applicant_id = auth.uid() and x.status <> 'withdrawn' limit 1) as my_application_id,
       (select x.status from adoption_applications x where x.adoption_id = a.id and x.applicant_id = auth.uid() and x.status <> 'withdrawn' limit 1) as my_application_status
from public.adoption_pets a
where a.status in ('active', 'paused', 'adopted') or a.user_id = auth.uid();
revoke all on public.adoption_cards from anon, authenticated;
grant select on public.adoption_cards to anon, authenticated;

-- 5) Yakın çevre bildirimi: kayıp ve sahiplendirme için ayrı onay, aynı (mahalle düzeyinde) bölge ----------------
alter table public.profiles add column if not exists adoption_alerts_enabled boolean not null default false;

drop function if exists public.set_lost_alert_area(boolean, double precision, double precision);
create or replace function public.set_community_alerts(p_lost boolean, p_adoption boolean, p_lat double precision, p_lng double precision)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_any boolean := coalesce(p_lost, false) or coalesce(p_adoption, false);
begin
    if auth.uid() is null then raise exception 'Giriş gerekli.'; end if;
    if v_any and (p_lat is null or p_lng is null) then raise exception 'Bildirim için bir bölge seç.'; end if;
    update profiles set
        lost_alerts_enabled = coalesce(p_lost, false),
        adoption_alerts_enabled = coalesce(p_adoption, false),
        alert_lat = case when v_any then round((p_lat / 0.01)::numeric) * 0.01 end,
        alert_lng = case when v_any then round((p_lng / 0.01)::numeric) * 0.01 end,
        alert_updated_at = now()
    where id = auth.uid();
end;
$$;
revoke execute on function public.set_community_alerts(boolean, boolean, double precision, double precision) from public;
grant execute on function public.set_community_alerts(boolean, boolean, double precision, double precision) to authenticated;

-- 6) Yayınlama: bildirimi açmış, 10 km içindeki kişilere bir kez haber verir -----------------------------------
create or replace function public.publish_adoption_listing(p_id uuid)
returns integer language plpgsql volatile security definer set search_path = public as $$
declare
    a public.adoption_pets;
    v_count integer := 0;
    u record;
begin
    select * into a from adoption_pets where id = p_id;
    if not found or a.user_id <> auth.uid() then raise exception 'İlan bulunamadı.'; end if;
    if a.status <> 'active' then raise exception 'İlan yayında değil.'; end if;
    if a.notified_at is not null then return a.notified_count; end if;
    if a.latitude is not null and a.longitude is not null then
        for u in
            select p.id from profiles p
            where p.adoption_alerts_enabled and p.alert_lat is not null and p.id <> a.user_id
              and km_between(a.latitude, a.longitude, p.alert_lat, p.alert_lng) <= 10
        loop
            perform notify_user(u.id, 'adoption', coalesce(nullif(a.pet_name, ''), 'Bir dost') || ' yuva arıyor',
                coalesce(a.location_text, 'Yakınında') || ' · sahiplendirme ilanına göz at.', a.user_id, a.id::text);
            v_count := v_count + 1;
        end loop;
    end if;
    update adoption_pets set notified_at = now(), notified_count = v_count where id = a.id;
    return v_count;
end;
$$;
revoke execute on function public.publish_adoption_listing(uuid) from public;
grant execute on function public.publish_adoption_listing(uuid) to authenticated;

create or replace function public.record_adoption_event(p_id uuid, p_event text)
returns void language sql volatile security definer set search_path = public as $$
    update adoption_pets set
        view_count = view_count + (p_event = 'view' and user_id is distinct from auth.uid())::integer,
        share_count = share_count + (p_event = 'share')::integer
    where id = p_id and status in ('active', 'paused');
$$;
revoke execute on function public.record_adoption_event(uuid, text) from public;
grant execute on function public.record_adoption_event(uuid, text) to anon, authenticated;

create or replace function public.get_adoption_owner_stats(p_id uuid)
returns table (views integer, applications integer, interviews integer, shares integer, notified integer, favorites integer)
language sql stable security definer set search_path = public as $$
    select a.view_count,
           (select count(*)::integer from adoption_applications x where x.adoption_id = a.id and x.status <> 'withdrawn'),
           (select count(*)::integer from adoption_applications x where x.adoption_id = a.id and x.interview_at is not null and x.status <> 'withdrawn'),
           a.share_count, a.notified_count,
           (select count(*)::integer from adoption_favorites f where f.adoption_id = a.id)
    from adoption_pets a where a.id = p_id and a.user_id = auth.uid();
$$;
revoke execute on function public.get_adoption_owner_stats(uuid) from public;
grant execute on function public.get_adoption_owner_stats(uuid) to authenticated;

-- 7) Başvuru akışı ---------------------------------------------------------------------------------------------
create or replace function public.submit_adoption_application(
    p_adoption_id uuid, p_full_name text, p_home_type text, p_home_features text[], p_household text[],
    p_children_ages text, p_experience text, p_experience_note text, p_reference text, p_message text)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
    a public.adoption_pets;
    v_id uuid;
    v_name text := trim(coalesce(p_full_name, ''));
begin
    if auth.uid() is null then raise exception 'Başvurmak için giriş yapmalısın.'; end if;
    select * into a from adoption_pets where id = p_adoption_id;
    if not found or a.status <> 'active' then raise exception 'Bu ilan şu an başvuru almıyor.'; end if;
    if a.user_id = auth.uid() then raise exception 'Kendi ilanına başvuramazsın.'; end if;
    if exists (select 1 from adoption_applications where adoption_id = a.id and applicant_id = auth.uid() and status <> 'withdrawn') then
        raise exception 'Bu ilana zaten başvurdun; durumunu Başvurularım''dan takip edebilirsin.';
    end if;
    if (select count(*) from adoption_applications where applicant_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
        raise exception 'Bugün çok fazla başvuru yaptın, yarın tekrar dene.';
    end if;
    insert into adoption_applications (adoption_id, applicant_id, owner_id, full_name, home_type, home_features, household,
        children_ages, experience, experience_note, reference_note, message)
    values (a.id, auth.uid(), a.user_id, v_name, p_home_type, coalesce(p_home_features, '{}'), coalesce(p_household, '{}'),
        nullif(trim(coalesce(p_children_ages, '')), ''), nullif(p_experience, ''), nullif(trim(coalesce(p_experience_note, '')), ''),
        nullif(trim(coalesce(p_reference, '')), ''), trim(coalesce(p_message, '')))
    returning id into v_id;
    perform notify_user(a.user_id, 'adoption_application', 'Yeni sahiplenme başvurusu',
        v_name || ', ' || coalesce(nullif(a.pet_name, ''), 'ilanın') || ' için başvurdu.', auth.uid(), v_id::text);
    return v_id;
end;
$$;
revoke execute on function public.submit_adoption_application(uuid, text, text, text[], text[], text, text, text, text, text) from public;
grant execute on function public.submit_adoption_application(uuid, text, text, text[], text[], text, text, text, text, text) to authenticated;

create or replace function public.respond_adoption_application(p_application_id uuid, p_action text, p_interview_at timestamptz, p_note text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
    x public.adoption_applications;
    a public.adoption_pets;
    v_note text := nullif(trim(coalesce(p_note, '')), '');
    v_pet text;
begin
    select * into x from adoption_applications where id = p_application_id;
    if not found or x.owner_id <> auth.uid() then raise exception 'Başvuru bulunamadı.'; end if;
    select * into a from adoption_pets where id = x.adoption_id;
    v_pet := coalesce(nullif(a.pet_name, ''), 'ilan');
    if char_length(coalesce(v_note, '')) > 300 then raise exception 'Not çok uzun.'; end if;

    if p_action = 'interview' then
        if x.status not in ('pending', 'interview') or a.status not in ('active', 'paused') then raise exception 'Bu başvuru için görüşme planlanamaz.'; end if;
        if p_interview_at is null or p_interview_at < now() then raise exception 'Görüşme için ileri bir tarih seç.'; end if;
        update adoption_applications set status = 'interview', interview_at = p_interview_at, interview_note = v_note, updated_at = now() where id = x.id;
        perform notify_user(x.applicant_id, 'adoption_update', v_pet || ' için görüşme planlandı',
            to_char(p_interview_at at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') || coalesce(' · ' || v_note, ''), auth.uid(), x.id::text);
    elsif p_action = 'accept' then
        if x.status not in ('pending', 'interview') or a.status not in ('active', 'paused') then raise exception 'Bu başvuru kabul edilemez.'; end if;
        update adoption_applications set status = 'accepted', owner_note = v_note, decided_at = now(), updated_at = now() where id = x.id;
        perform notify_user(x.applicant_id, 'adoption_update', v_pet || ' için başvurun kabul edildi',
            coalesce(v_note, 'İlan sahibi seninle tanışmak için mesaj atacak.'), auth.uid(), x.id::text);
    elsif p_action = 'reject' then
        if x.status not in ('pending', 'interview', 'accepted') then raise exception 'Bu başvuru zaten sonuçlandı.'; end if;
        update adoption_applications set status = 'rejected', owner_note = v_note, decided_at = now(), updated_at = now() where id = x.id;
        perform notify_user(x.applicant_id, 'adoption_update', v_pet || ' için başvurun sonuçlandı',
            coalesce(v_note, 'Bu sefer olmadı. İlgin için teşekkürler; yuva arayan başka dostlar da var.'), auth.uid(), x.id::text);
    else
        raise exception 'Geçersiz işlem.';
    end if;
end;
$$;
revoke execute on function public.respond_adoption_application(uuid, text, timestamptz, text) from public;
grant execute on function public.respond_adoption_application(uuid, text, timestamptz, text) to authenticated;

create or replace function public.withdraw_adoption_application(p_application_id uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare x public.adoption_applications;
begin
    select * into x from adoption_applications where id = p_application_id;
    if not found or x.applicant_id <> auth.uid() then raise exception 'Başvuru bulunamadı.'; end if;
    if x.status not in ('pending', 'interview', 'accepted') then raise exception 'Bu başvuru zaten sonuçlandı.'; end if;
    update adoption_applications set status = 'withdrawn', decided_at = now(), updated_at = now() where id = x.id;
    perform notify_user(x.owner_id, 'adoption_application', 'Bir başvuru geri çekildi',
        x.full_name || ' başvurusunu geri çekti.', auth.uid(), x.id::text);
end;
$$;
revoke execute on function public.withdraw_adoption_application(uuid) from public;
grant execute on function public.withdraw_adoption_application(uuid) to authenticated;

-- Açık başvuruları kapatır (ilan kapanınca / başka yuvaya gidince), başvuranlara haber verir.
create or replace function public.close_open_adoption_applications(p_adoption_id uuid, p_except uuid, p_note text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare x record; v_pet text;
begin
    select coalesce(nullif(pet_name, ''), 'İlan') into v_pet from adoption_pets where id = p_adoption_id;
    for x in select id, applicant_id, owner_id from adoption_applications
             where adoption_id = p_adoption_id and status in ('pending', 'interview', 'accepted') and id is distinct from p_except
    loop
        update adoption_applications set status = 'rejected', owner_note = p_note, decided_at = now(), updated_at = now() where id = x.id;
        perform notify_user(x.applicant_id, 'adoption_update', v_pet || ' için başvurun sonuçlandı', p_note, x.owner_id, x.id::text);
    end loop;
end;
$$;
revoke execute on function public.close_open_adoption_applications(uuid, uuid, text) from public;

-- İlanı durdur / yeniden yayınla / kapat.
create or replace function public.set_adoption_listing_status(p_id uuid, p_status text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare a public.adoption_pets;
begin
    select * into a from adoption_pets where id = p_id;
    if not found or a.user_id <> auth.uid() then raise exception 'İlan bulunamadı.'; end if;
    if a.status not in ('active', 'paused') then raise exception 'Bu ilan artık değiştirilemez.'; end if;
    if p_status not in ('active', 'paused', 'closed') then raise exception 'Geçersiz durum.'; end if;
    update adoption_pets set status = p_status where id = a.id;
    if p_status = 'closed' then
        perform close_open_adoption_applications(a.id, null, 'İlan sahibi ilanı kapattı. İlgin için teşekkürler.');
    end if;
end;
$$;
revoke execute on function public.set_adoption_listing_status(uuid, text) from public;
grant execute on function public.set_adoption_listing_status(uuid, text) to authenticated;

-- 8) Pasaport devri: eski e-postaya dayalı devir (hiçbir ekrandan kullanılmıyordu) yerine kimliğe bağlı devir ------
alter table public.pet_ownership_transfers
    add column if not exists adoption_id uuid references public.adoption_pets(id) on delete set null;
-- Devir artık alıcının hesabına (to_owner_id) bağlı; e-posta sadece eski kayıtlarda var.
-- (Canlıda ayrı migration olarak uygulandı: pet_transfer_email_optional)
alter table public.pet_ownership_transfers alter column to_email drop not null;
drop function if exists public.accept_pet_transfer(uuid);
drop policy if exists "Owner manages own transfers" on public.pet_ownership_transfers;
drop policy if exists "Recipient can reject pending transfers" on public.pet_ownership_transfers;
drop policy if exists "Recipient can view pending transfers" on public.pet_ownership_transfers;
drop policy if exists "Transfers: parties read" on public.pet_ownership_transfers;
create policy "Transfers: parties read" on public.pet_ownership_transfers for select to authenticated
    using (from_owner_id = auth.uid() or to_owner_id = auth.uid());
revoke all on public.pet_ownership_transfers from anon, authenticated;
grant select on public.pet_ownership_transfers to authenticated;

-- Sahiplendirildi olarak kapat. İsteğe bağlı: kabul edilen kişiye pasaport devri teklif edilir.
create or replace function public.complete_adoption(p_id uuid, p_application_id uuid, p_transfer_passport boolean)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
    a public.adoption_pets;
    x public.adoption_applications;
    v_transfer uuid;
    v_pet text;
begin
    select * into a from adoption_pets where id = p_id;
    if not found or a.user_id <> auth.uid() then raise exception 'İlan bulunamadı.'; end if;
    if a.status not in ('active', 'paused') then raise exception 'Bu ilan zaten kapanmış.'; end if;
    v_pet := coalesce(nullif(a.pet_name, ''), 'Dostun');

    if p_application_id is not null then
        select * into x from adoption_applications where id = p_application_id and adoption_id = a.id;
        if not found or x.status not in ('pending', 'interview', 'accepted') then raise exception 'Seçilen başvuru geçerli değil.'; end if;
        update adoption_applications set status = 'accepted', decided_at = coalesce(decided_at, now()), updated_at = now() where id = x.id;
    end if;

    update adoption_pets set status = 'adopted', adopted_at = now(), adopted_by = x.applicant_id where id = a.id;
    perform close_open_adoption_applications(a.id, p_application_id, v_pet || ' başka bir yuvaya kavuştu. İlgin için teşekkürler.');

    if p_application_id is not null then
        perform notify_user(x.applicant_id, 'adoption_update', 'Tebrikler! ' || v_pet || ' artık seninle',
            'İlan sahibi sahiplendirmeyi tamamladı.', auth.uid(), x.id::text);
        if coalesce(p_transfer_passport, false) and a.pet_id is not null
           and exists (select 1 from pets where id = a.pet_id and owner_id = auth.uid()) then
            update pet_ownership_transfers set status = 'cancelled', responded_at = now() where pet_id = a.pet_id and status = 'pending';
            insert into pet_ownership_transfers (pet_id, from_owner_id, to_owner_id, adoption_id, status, expires_at)
            values (a.pet_id, auth.uid(), x.applicant_id, a.id, 'pending', now() + interval '30 days')
            returning id into v_transfer;
            perform notify_user(x.applicant_id, 'pet_transfer', 'Pasaport devri: ' || v_pet,
                'Kabul edersen aşı, muayene ve kilo geçmişiyle birlikte pasaportu senin hesabına geçer.', auth.uid(), v_transfer::text);
        end if;
    end if;
    return v_transfer;
end;
$$;
revoke execute on function public.complete_adoption(uuid, uuid, boolean) from public;
grant execute on function public.complete_adoption(uuid, uuid, boolean) to authenticated;

-- Yeni sahip devri kabul eder ya da reddeder. Kabulde eski sahibin kişisel bilgileri (acil iletişim, paylaşım
-- bağlantıları) hayvandan ayrılır; sağlık geçmişi hayvanla birlikte kalır.
create or replace function public.respond_pet_transfer(p_transfer_id uuid, p_accept boolean)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
    t public.pet_ownership_transfers;
    v_pet text;
begin
    select * into t from pet_ownership_transfers where id = p_transfer_id;
    if not found or t.to_owner_id is distinct from auth.uid() then raise exception 'Devir bulunamadı.'; end if;
    if t.status <> 'pending' or t.expires_at < now() then raise exception 'Bu devrin süresi dolmuş ya da zaten sonuçlanmış.'; end if;
    select name into v_pet from pets where id = t.pet_id;

    if not coalesce(p_accept, false) then
        update pet_ownership_transfers set status = 'rejected', responded_at = now() where id = t.id;
        perform notify_user(t.from_owner_id, 'pet_transfer', 'Pasaport devri reddedildi',
            coalesce(v_pet, 'Hayvanın') || ' pasaportu sende kalmaya devam ediyor.', auth.uid(), t.id::text);
        return;
    end if;

    if not exists (select 1 from pets where id = t.pet_id and owner_id = t.from_owner_id) then
        update pet_ownership_transfers set status = 'cancelled', responded_at = now() where id = t.id;
        raise exception 'Pasaport artık devredenin hesabında değil.';
    end if;

    update pets set owner_id = auth.uid(), is_lost = false, show_phone = false where id = t.pet_id;
    update pet_health_profile set contact_name = null, contact_phone = null, alt_contact_name = null,
        alt_contact_phone = null, show_on_lost = false, show_on_qr = false, updated_at = now()
    where pet_id = t.pet_id;
    update pet_share_links set revoked_at = now() where pet_id = t.pet_id and revoked_at is null;
    update lost_pets set status = 'resolved', resolved_at = now(), resolution = 'closed' where pet_id = t.pet_id and status = 'active';
    update pet_ownership_transfers set status = 'accepted', responded_at = now() where id = t.id;
    perform notify_user(t.from_owner_id, 'pet_transfer', 'Pasaport devri tamamlandı',
        coalesce(v_pet, 'Hayvanın') || ' pasaportu yeni ailesine geçti.', auth.uid(), t.id::text);
end;
$$;
revoke execute on function public.respond_pet_transfer(uuid, boolean) from public;
grant execute on function public.respond_pet_transfer(uuid, boolean) to authenticated;

-- 9) Yönetici denetimi (şikâyetler `reports` tablosuna düşer; eski adoption_reports hiç kullanılmadı) --------------
create or replace function public.moderate_adoption_listing(p_id uuid, p_action text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare a public.adoption_pets;
begin
    if get_my_role() is distinct from 'admin' then raise exception 'Yetkisiz.'; end if;
    select * into a from adoption_pets where id = p_id;
    if not found then raise exception 'İlan bulunamadı.'; end if;
    if p_action = 'remove' then
        update adoption_pets set status = 'removed' where id = a.id;
        perform close_open_adoption_applications(a.id, null, 'İlan yayından kaldırıldı.');
        perform notify_user(a.user_id, 'adoption', 'İlanın yayından kaldırıldı',
            'Topluluk kurallarına uymadığı için kaldırıldı. Sorun olduğunu düşünüyorsan destekle iletişime geç.', null, a.id::text);
    elsif p_action = 'restore' and a.status = 'removed' then
        update adoption_pets set status = 'active' where id = a.id;
    else
        raise exception 'Geçersiz işlem.';
    end if;
end;
$$;
revoke execute on function public.moderate_adoption_listing(uuid, text) from public;
grant execute on function public.moderate_adoption_listing(uuid, text) to authenticated;

drop table if exists public.adoption_reports;

-- 10) Bildirim türleri: başvuru (ilan sahibine), başvuru durumu ve pasaport devri (başvurana) e-postayla da gider.
create or replace function public.notify_user(p_user_id uuid, p_type text, p_title text, p_content text, p_actor_id uuid, p_entity_id text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_is_business boolean;
begin
  if p_user_id is null or p_user_id = p_actor_id then return; end if;
  insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
  values (p_user_id, p_type, p_title, p_content, p_actor_id, p_entity_id, false);
  if p_type in ('appointment', 'order', 'health', 'sos', 'lost_sighting', 'adoption_application', 'adoption_update', 'pet_transfer') then
    select role = 'business' into v_is_business from profiles where id = p_user_id;
    perform enqueue_email(p_user_id, 'Moffi · ' || p_title, p_title, p_content,
      case
        when p_type = 'health' then '/health'
        when p_type = 'sos' then '/pasaport'
        when p_type = 'lost_sighting' then '/kayip/' || p_entity_id || '/yonet'
        when p_type = 'adoption_application' then '/sahiplendirme/basvuru/' || p_entity_id
        when p_type in ('adoption_update', 'pet_transfer') then '/sahiplendirme/basvurularim'
        when p_type = 'appointment' and coalesce(v_is_business, false) then '/business/calendar'
        when p_type = 'appointment' then '/vet'
        when coalesce(v_is_business, false) then '/business/orders'
        else '/petshop'
      end);
  end if;
end;
$$;
