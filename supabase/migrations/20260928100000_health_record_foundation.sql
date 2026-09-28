-- Sağlık Kaydı temeli (Sağlık Mimarisi Raporu S1 + S2, 2026-09-28)
-- Tek kayıt: aşı tanımları (türe göre), aşılar, parazit, kilo, ilaç + doz, belgeler, acil bilgiler.
-- İşletme muayenesi tek sunucu fonksiyonuyla (record_consultation) yazılır.

-- ---------------------------------------------------------------------------
-- 1. Aşı tanımları: kodda üç ayrı yerde sabit (ve sadece köpek) listeler vardı.
-- ---------------------------------------------------------------------------
create table public.vaccine_definitions (
    id text primary key,
    species text not null check (species in ('dog','cat')),
    name text not null,
    description text,
    is_core boolean not null default false,
    frequency_months int not null check (frequency_months between 1 and 60),
    min_age_weeks int not null default 0,
    sort int not null default 0
);
alter table public.vaccine_definitions enable row level security;
create policy "Vaccine definitions are public" on public.vaccine_definitions for select using (true);
grant select on public.vaccine_definitions to anon, authenticated;

insert into public.vaccine_definitions (id, species, name, description, is_core, frequency_months, min_age_weeks, sort) values
('dog_karma',  'dog', 'Karma aşı (DHPPi)', 'Gençlik hastalığı, parvovirüs, hepatit ve parainfluenzaya karşı temel aşı.', true, 12, 6, 10),
('dog_kuduz',  'dog', 'Kuduz aşısı', 'Türkiye''de yasal olarak zorunlu.', true, 12, 12, 20),
('dog_lepto',  'dog', 'Leptospiroz aşısı', 'Su birikintisi ve kemirgenlerle temas eden köpeklere önerilir.', false, 12, 8, 30),
('dog_bronsin','dog', 'Bronşin (kennel cough)', 'Pansiyon, park ve diğer köpeklerle sık bir arada olan köpeklere önerilir.', false, 12, 8, 40),
('dog_lyme',   'dog', 'Lyme aşısı', 'Kene riski yüksek bölgelerde önerilir.', false, 12, 12, 50),
('cat_karma',  'cat', 'Karma kedi aşısı (FVRCP)', 'Panlökopeni, herpes ve calicivirüse karşı temel aşı.', true, 12, 8, 10),
('cat_kuduz',  'cat', 'Kuduz aşısı', 'Türkiye''de yasal olarak zorunlu.', true, 12, 12, 20),
('cat_losemi', 'cat', 'Lösemi aşısı (FeLV)', 'Dışarı çıkan ya da başka kedilerle yaşayan kedilere önerilir.', false, 12, 8, 30);

-- ---------------------------------------------------------------------------
-- 2. Aşılar
-- ---------------------------------------------------------------------------
alter table public.vaccines
    add column definition_id text references public.vaccine_definitions(id),
    add column source text not null default 'owner' check (source in ('owner','clinic')),
    add column clinic_id uuid references public.profiles(id) on delete set null,
    add column batch_no text,
    add column notes text;
update public.vaccines set status = 'pending' where status is null or status not in ('pending','completed');
alter table public.vaccines add constraint vaccines_status_check check (status in ('pending','completed'));

-- Eski kayıtları tanımlara bağla (türüne göre).
update public.vaccines v set definition_id = case
        when p.type = 'cat' and v.name = 'rabies' then 'cat_kuduz'
        when p.type = 'cat' and v.name = 'mixed'  then 'cat_karma'
        when p.type = 'dog' and v.name = 'rabies' then 'dog_kuduz'
        when p.type = 'dog' and v.name = 'mixed'  then 'dog_karma'
        when p.type = 'dog' and v.name = 'kc'     then 'dog_bronsin'
    end
from public.pets p where p.id = v.pet_id and v.name in ('rabies','mixed','kc');
update public.vaccines v set name = d.name from public.vaccine_definitions d where d.id = v.definition_id;

-- ---------------------------------------------------------------------------
-- 3. Parazit uygulamaları (önceden "aşı" gibi ve sos_settings içinde tutuluyordu)
-- ---------------------------------------------------------------------------
create table public.parasite_treatments (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    kind text not null check (kind in ('internal','external','combined')),
    product text,
    applied_on date,
    next_due_on date,
    status text not null default 'done' check (status in ('planned','done')),
    notes text,
    source text not null default 'owner' check (source in ('owner','clinic')),
    clinic_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    check (status = 'planned' or applied_on is not null)
);
create index parasite_treatments_pet_idx on public.parasite_treatments (pet_id, applied_on desc);

-- Kedi/köpek aşısı sanılan iç/dış parazit planları buraya taşınır; kediye planlanmış köpek aşısı silinir.
insert into public.parasite_treatments (pet_id, kind, status, next_due_on, created_at)
select v.pet_id, case v.name when 'internal' then 'internal' else 'external' end, 'planned',
       (v.next_due_date at time zone 'Europe/Istanbul')::date, v.created_at
from public.vaccines v where v.name in ('internal','external');
delete from public.vaccines where name in ('internal','external');
delete from public.vaccines v using public.pets p
where p.id = v.pet_id and p.type = 'cat' and v.name = 'kc' and v.status = 'pending';

insert into public.parasite_treatments (pet_id, kind, applied_on, status)
select id, 'internal', (sos_settings->>'parasiteInternal')::date, 'done' from public.pets
where coalesce(sos_settings->>'parasiteInternal','') ~ '^\d{4}-\d{2}-\d{2}';
insert into public.parasite_treatments (pet_id, kind, applied_on, status)
select id, 'external', (sos_settings->>'parasiteExternal')::date, 'done' from public.pets
where coalesce(sos_settings->>'parasiteExternal','') ~ '^\d{4}-\d{2}-\d{2}';

-- ---------------------------------------------------------------------------
-- 4. Kilo geçmişi (önceden tek değer; pets.weight artık en son ölçümün aynası)
-- ---------------------------------------------------------------------------
create table public.pet_weight_logs (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg < 200),
    measured_on date not null,
    source text not null default 'owner' check (source in ('owner','clinic')),
    medical_record_id uuid references public.medical_records(id) on delete set null,
    created_at timestamptz not null default now()
);
create index pet_weight_logs_pet_idx on public.pet_weight_logs (pet_id, measured_on desc, created_at desc);

insert into public.pet_weight_logs (pet_id, weight_kg, measured_on, source)
select p.id,
       case when parsed is not null and abs(parsed - p.weight) < 1 then parsed else p.weight end,
       coalesce(p.created_at, now())::date, 'owner'
from (
    select *, nullif(replace(regexp_replace(coalesce(sos_settings->>'weight',''), '[^0-9,\.]', '', 'g'), ',', '.'), '')::numeric as parsed
    from public.pets
) p
where p.weight is not null and p.weight > 0 and p.weight < 200;

create or replace function public.sync_pet_weight_from_logs() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_pet uuid := coalesce(new.pet_id, old.pet_id); v_w numeric;
begin
    select weight_kg into v_w from pet_weight_logs where pet_id = v_pet
    order by measured_on desc, created_at desc limit 1;
    update pets set weight = v_w where id = v_pet and weight is distinct from v_w;
    return null;
end $$;
create trigger pet_weight_logs_sync after insert or update or delete on public.pet_weight_logs
for each row execute function public.sync_pet_weight_from_logs();

-- Profil ayarlarından kilo değişirse ölçüm olarak kaydedilir (eski ekranlar da tek kaynağa yazar).
create or replace function public.log_pet_weight_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_last numeric;
begin
    if new.weight is null or new.weight <= 0 or new.weight >= 200 then return new; end if;
    select weight_kg into v_last from pet_weight_logs where pet_id = new.id
    order by measured_on desc, created_at desc limit 1;
    if v_last is distinct from new.weight then
        insert into pet_weight_logs (pet_id, weight_kg, measured_on, source)
        values (new.id, new.weight, (wall_now())::date, 'owner');
    end if;
    return new;
end $$;
create trigger pets_log_weight_change after update of weight on public.pets
for each row when (new.weight is distinct from old.weight) execute function public.log_pet_weight_change();

-- Ondalığı kaybolmuş eski değerleri (ör. "10,5 kg" → 10) ölçüm geçmişiyle bir kez eşitle.
update public.pets p set weight = l.weight_kg
from (select distinct on (pet_id) pet_id, weight_kg from public.pet_weight_logs
      order by pet_id, measured_on desc, created_at desc) l
where l.pet_id = p.id and p.weight is distinct from l.weight_kg;

-- ---------------------------------------------------------------------------
-- 5. Acil bilgiler
-- ---------------------------------------------------------------------------
create table public.pet_health_profile (
    pet_id uuid primary key references public.pets(id) on delete cascade,
    allergies text[] not null default '{}',
    chronic_conditions text[] not null default '{}',
    blood_type text,
    primary_clinic_id uuid references public.profiles(id) on delete set null,
    primary_vet_name text,
    primary_vet_phone text,
    show_on_lost boolean not null default false,
    show_on_qr boolean not null default false,
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. İlaçlar + doz kaydı (ilaç tablosunda istemci yetkisi hiç yoktu; özellik hiç çalışmamıştı)
-- ---------------------------------------------------------------------------
alter table public.medications
    add column end_date date,
    add column dose_times text[] not null default '{}',
    add column prescribed_by text,
    add column source text not null default 'owner' check (source in ('owner','clinic')),
    add column clinic_id uuid references public.profiles(id) on delete set null,
    add column medical_record_id uuid references public.medical_records(id) on delete set null;

create table public.medication_doses (
    id uuid primary key default gen_random_uuid(),
    medication_id uuid not null references public.medications(id) on delete cascade,
    pet_id uuid not null references public.pets(id) on delete cascade,
    dose_date date not null,
    slot text not null,
    given_at timestamptz not null default now(),
    given_by uuid default auth.uid() references auth.users(id) on delete set null,
    unique (medication_id, dose_date, slot)
);

-- Muayenede yazılmış ama tabloya hiç ulaşamamış reçeteler geri kazanılır.
insert into public.medications (pet_id, name, dosage, instructions, start_date, end_date, is_active,
                                prescribed_by, source, clinic_id, medical_record_id, created_at)
select mr.pet_id, m->>'name', nullif(m->>'dose',''),
       case when (m->>'duration') ~ '^\d+$' then (m->>'duration') || ' gün boyunca kullanılacak.' end,
       mr.created_at,
       case when (m->>'duration') ~ '^\d+$' then mr.created_at::date + (m->>'duration')::int end,
       case when (m->>'duration') ~ '^\d+$' then mr.created_at::date + (m->>'duration')::int >= current_date else false end,
       mr.vet_name, 'clinic',
       case when mr.clinic_id ~ '^[0-9a-f-]{36}$' and exists (select 1 from profiles where id = mr.clinic_id::uuid) then mr.clinic_id::uuid end,
       mr.id, mr.created_at
from public.medical_records mr, jsonb_array_elements(coalesce(mr.medications, '[]'::jsonb)) m
where coalesce(m->>'name','') <> '';

-- ---------------------------------------------------------------------------
-- 7. Belgeler (özel medical-documents alanı; yol: {pet_id}/{dosya})
-- ---------------------------------------------------------------------------
create table public.pet_documents (
    id uuid primary key default gen_random_uuid(),
    pet_id uuid not null references public.pets(id) on delete cascade,
    category text not null default 'other'
        check (category in ('vaccine_card','lab','imaging','prescription','invoice','report','other')),
    title text not null,
    storage_path text not null unique,
    mime_type text,
    size_bytes bigint,
    doc_date date not null default current_date,
    medical_record_id uuid references public.medical_records(id) on delete set null,
    uploaded_by uuid default auth.uid() references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);
create index pet_documents_pet_idx on public.pet_documents (pet_id, doc_date desc);

-- ---------------------------------------------------------------------------
-- 8. Yetkiler: sahip kendi hayvanının kaydını yönetir
-- ---------------------------------------------------------------------------
create or replace function public.owns_pet(p_pet_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from pets where id = p_pet_id and owner_id = auth.uid());
$$;
revoke execute on function public.owns_pet(uuid) from public;
grant execute on function public.owns_pet(uuid) to authenticated;

alter table public.parasite_treatments enable row level security;
alter table public.pet_weight_logs enable row level security;
alter table public.pet_health_profile enable row level security;
alter table public.medication_doses enable row level security;
alter table public.pet_documents enable row level security;

create policy "Owner manages parasite treatments" on public.parasite_treatments
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));
create policy "Owner manages weight logs" on public.pet_weight_logs
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));
create policy "Owner manages health profile" on public.pet_health_profile
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));
create policy "Owner manages medication doses" on public.medication_doses
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));
create policy "Owner manages pet documents" on public.pet_documents
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));

grant select, insert, update, delete on public.parasite_treatments, public.pet_weight_logs,
    public.pet_health_profile, public.medication_doses, public.pet_documents to authenticated;

-- İlaç ve aşı: tek, sade sahip kuralı (yinelenen eski kurallar kaldırıldı); anon'un yetkisi alındı.
drop policy if exists "Users can manage their pet medications" on public.medications;
drop policy if exists "Users update pet medications" on public.medications;
create policy "Owner manages medications" on public.medications
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));
revoke all on public.medications from anon;
grant select, insert, update, delete on public.medications to authenticated;

drop policy if exists "Owners can manage their pets vaccines" on public.vaccines;
drop policy if exists "Users can manage their pet vaccines" on public.vaccines;
drop policy if exists "Owners can read their pets vaccines" on public.vaccines;
create policy "Owner manages vaccines" on public.vaccines
    for all to authenticated using (owns_pet(pet_id)) with check (owns_pet(pet_id));
revoke all on public.vaccines from anon;
revoke truncate, references, trigger on public.vaccines from authenticated;

-- Muayene kaydı artık sadece record_consultation ile yazılır (işletme herhangi bir hayvana kayıt açabiliyordu).
drop policy if exists "Clinics can insert medical records" on public.medical_records;
revoke insert, update, delete, truncate, references, trigger on public.medical_records from authenticated;
revoke all on public.medical_records from anon;

-- ---------------------------------------------------------------------------
-- 9. Depolama: tüm alanları herkese açan kural kaldırıldı; tıbbi belgeler gerçekten özel.
-- ---------------------------------------------------------------------------
drop policy if exists "Public Viewing" on storage.objects;
drop policy if exists "Enforce privacy for medical documents" on storage.objects;
drop policy if exists "Clinics can upload medical documents" on storage.objects;
drop policy if exists "Owners and clinics can view medical documents" on storage.objects;

-- Yolun ilk klasörü hayvan id'si; UUID değilse (ya da sahibi değilse) false.
create or replace function public.owns_pet_folder(p_object_name text) returns boolean
language sql stable security definer set search_path = public as $$
    select case when split_part(p_object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                then owns_pet(split_part(p_object_name, '/', 1)::uuid) else false end;
$$;
revoke execute on function public.owns_pet_folder(text) from public;
grant execute on function public.owns_pet_folder(text) to authenticated;

create policy "Medical documents: owner or treating clinic reads" on storage.objects
for select to authenticated using (
    bucket_id = 'medical-documents' and (
        public.owns_pet_folder(name)
        or exists (select 1 from public.medical_records mr
                   where mr.pet_id::text = split_part(name, '/', 1) and mr.clinic_id = auth.uid()::text)
    )
);
create policy "Medical documents: owner uploads" on storage.objects
for insert to authenticated with check (bucket_id = 'medical-documents' and public.owns_pet_folder(name));
create policy "Medical documents: owner deletes" on storage.objects
for delete to authenticated using (bucket_id = 'medical-documents' and public.owns_pet_folder(name));

-- ---------------------------------------------------------------------------
-- 10. İşletme muayenesi: tek, atomik sunucu fonksiyonu
-- ---------------------------------------------------------------------------
create or replace function public.record_consultation(
    p_appointment_id uuid,
    p_diagnosis text,
    p_critical_notes text default null,
    p_weight_kg numeric default null,
    p_temperature_c numeric default null,
    p_vaccines jsonb default '[]'::jsonb,
    p_medications jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    a record;
    v_species text;
    v_vet text;
    v_record uuid;
    v_today date := (wall_now())::date;
    v jsonb; m jsonb; d record;
    v_date date; v_next date; v_days int;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    select * into a from appointments where id = p_appointment_id for update;
    if not found then raise exception 'Randevu bulunamadı'; end if;
    if a.clinic_id is distinct from v_uid then raise exception 'Bu randevu size ait değil'; end if;
    if a.status not in ('pending','confirmed') then raise exception 'Bu randevu tamamlanamaz (durum: %)', a.status; end if;
    if a.pet_id is null then raise exception 'Bu randevuda Moffi''ye kayıtlı bir evcil hayvan yok; muayene kaydı hesap eşleşince girilebilir'; end if;
    if coalesce(btrim(p_diagnosis), '') = '' then raise exception 'Tanı zorunlu'; end if;
    if exists (select 1 from medical_records where appointment_id = p_appointment_id) then
        raise exception 'Bu randevu için muayene kaydı zaten var';
    end if;
    if p_weight_kg is not null and (p_weight_kg <= 0 or p_weight_kg >= 200) then raise exception 'Kilo geçersiz'; end if;
    if p_temperature_c is not null and (p_temperature_c < 30 or p_temperature_c > 45) then raise exception 'Vücut sıcaklığı geçersiz'; end if;

    select type into v_species from pets where id = a.pet_id;
    v_vet := coalesce(nullif(a.doctor_name, ''), business_display_name(v_uid));

    insert into medical_records (pet_id, appointment_id, clinic_id, vet_name, diagnosis, critical_notes,
                                 weight_kg, temperature_c, medications)
    values (a.pet_id, a.id, v_uid::text, v_vet, btrim(p_diagnosis), nullif(btrim(coalesce(p_critical_notes, '')), ''),
            p_weight_kg, p_temperature_c, coalesce(p_medications, '[]'::jsonb))
    returning id into v_record;

    if p_weight_kg is not null then
        insert into pet_weight_logs (pet_id, weight_kg, measured_on, source, medical_record_id)
        values (a.pet_id, p_weight_kg, v_today, 'clinic', v_record);
    end if;

    for v in select * from jsonb_array_elements(coalesce(p_vaccines, '[]'::jsonb)) loop
        select * into d from vaccine_definitions where id = v->>'definition_id' and species = v_species;
        if d.id is null and coalesce(btrim(v->>'name'), '') = '' then continue; end if;
        v_date := coalesce(nullif(v->>'date', '')::date, v_today);
        v_next := coalesce(nullif(v->>'next_date', '')::date,
                           case when d.id is not null then (v_date + make_interval(months => d.frequency_months))::date end);
        -- Aynı aşının açık planı varsa, yapılan doz onu kapatır.
        if d.id is not null then
            delete from vaccines where pet_id = a.pet_id and definition_id = d.id and status = 'pending';
        end if;
        insert into vaccines (pet_id, name, definition_id, status, date_administered, next_due_date,
                              vet_name, source, clinic_id, batch_no)
        values (a.pet_id, coalesce(d.name, btrim(v->>'name')), d.id, 'completed', v_date, v_next,
                v_vet, 'clinic', v_uid, nullif(btrim(coalesce(v->>'batch', '')), ''));
    end loop;

    for m in select * from jsonb_array_elements(coalesce(p_medications, '[]'::jsonb)) loop
        if coalesce(btrim(m->>'name'), '') = '' then continue; end if;
        v_days := case when (m->>'duration') ~ '^\d+$' then (m->>'duration')::int end;
        insert into medications (pet_id, name, dosage, frequency, instructions, start_date, end_date,
                                 is_active, prescribed_by, source, clinic_id, medical_record_id)
        values (a.pet_id, btrim(m->>'name'), nullif(btrim(coalesce(m->>'dose', '')), ''),
                nullif(btrim(coalesce(m->>'frequency', '')), ''),
                case when v_days is not null then v_days || ' gün boyunca kullanılacak.' end,
                v_today, case when v_days is not null then v_today + v_days end,
                true, v_vet, 'clinic', v_uid, v_record);
    end loop;

    perform transition_appointment(p_appointment_id, 'completed', null);
    return v_record;
end $$;
revoke execute on function public.record_consultation(uuid, text, text, numeric, numeric, jsonb, jsonb) from public;
grant execute on function public.record_consultation(uuid, text, text, numeric, numeric, jsonb, jsonb) to authenticated;

revoke execute on function public.sync_pet_weight_from_logs() from public;
revoke execute on function public.log_pet_weight_change() from public;

-- Eski kayıtlarda veteriner adı yerine işletmenin e-posta adresi yazılmıştı (bkz. CLAUDE.md 8.41).
update public.medical_records set vet_name = public.business_display_name(clinic_id::uuid)
where vet_name like '%@%' and clinic_id ~ '^[0-9a-f-]{36}$';
update public.medications m set prescribed_by = public.business_display_name(m.clinic_id)
where m.prescribed_by like '%@%' and m.clinic_id is not null;
update public.vaccines v set vet_name = public.business_display_name(v.clinic_id)
where v.vet_name like '%@%' and v.clinic_id is not null;
