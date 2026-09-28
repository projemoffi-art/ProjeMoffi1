-- Muayene kaydı o ziyarette yapılan aşıların anlık görüntüsünü de tutar (işletme ve karne
-- "Yapılan işlemler" için; işletme hastanın aşı tablosunu RLS gereği okuyamaz).
alter table public.medical_records add column vaccines jsonb not null default '[]'::jsonb;

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
    v_date date; v_next date; v_days int; v_name text;
    v_snapshot jsonb := '[]'::jsonb;
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
        v_name := coalesce(d.name, nullif(btrim(coalesce(v->>'name', '')), ''));
        if v_name is null then continue; end if;
        v_date := coalesce(nullif(v->>'date', '')::date, v_today);
        v_next := coalesce(nullif(v->>'next_date', '')::date,
                           case when d.id is not null then (v_date + make_interval(months => d.frequency_months))::date end);
        if d.id is not null then
            delete from vaccines where pet_id = a.pet_id and definition_id = d.id and status = 'pending';
        end if;
        insert into vaccines (pet_id, name, definition_id, status, date_administered, next_due_date,
                              vet_name, source, clinic_id, batch_no)
        values (a.pet_id, v_name, d.id, 'completed', v_date, v_next,
                v_vet, 'clinic', v_uid, nullif(btrim(coalesce(v->>'batch', '')), ''));
        v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
            'name', v_name, 'definition_id', d.id, 'date', v_date, 'next_date', v_next,
            'batch', nullif(btrim(coalesce(v->>'batch', '')), '')));
    end loop;
    update medical_records set vaccines = v_snapshot where id = v_record;

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
