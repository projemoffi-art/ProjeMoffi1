-- Sahip, Moffi dışındaki bir veteriner ziyaretini kendi karnesine ekleyebilir (source='owner').
-- İşletme kayıtları yalnızca record_consultation ile yazılır; sahip onlara dokunamaz.
alter table public.medical_records
    add column source text not null default 'clinic' check (source in ('clinic','owner')),
    add column visit_date date,
    add column external_clinic_name text,
    alter column clinic_id drop not null;
alter table public.medical_records add constraint medical_records_source_clinic_check
    check ((source = 'clinic' and clinic_id is not null) or (source = 'owner' and clinic_id is null));

create policy "Owner adds own visit records" on public.medical_records
    for insert to authenticated with check (source = 'owner' and clinic_id is null and owns_pet(pet_id));
create policy "Owner edits own visit records" on public.medical_records
    for update to authenticated using (source = 'owner' and owns_pet(pet_id))
    with check (source = 'owner' and clinic_id is null and owns_pet(pet_id));
create policy "Owner deletes own visit records" on public.medical_records
    for delete to authenticated using (source = 'owner' and owns_pet(pet_id));
grant insert, update, delete on public.medical_records to authenticated;
