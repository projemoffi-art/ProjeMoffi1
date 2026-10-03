-- Sahipsiz hasta kaydı (unclaimed_patients) sahiplenme güvenliği (2026-10-04).
-- Eski durum: check_unclaimed_matches(p_phone) HERHANGİ bir numarayla çağrılabiliyordu (başkasının numarasını yazan,
-- o kişinin hayvan adlarını ve kliniğini görüyordu); request_manual_claim herhangi bir kayıt kimliğine, kayıt kendisinin
-- olup olmadığına bakmadan istek bırakabiliyordu. SMS kodu yolu (verify_and_claim) SMS gönderilmediği için hiç çalışmıyor.
-- Yeni: eşleşme yalnızca kişinin profilindeki kendi telefonuyla; istek de yalnızca bu eşleşen kayıtlar için; klinik bildirim alır
-- ve /business/migration ekranında onaylar (approve_manual_claim, değişmedi).

create or replace function public.normalize_tr_phone(p_phone text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $$
declare v text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
    if v = '' then return null; end if;
    if left(v, 1) = '0' then return '+9' || v; end if;
    if left(v, 2) <> '90' then return '+90' || v; end if;
    return '+' || v;
end $$;

-- Kişinin kendi telefonuyla eşleşen, henüz sahiplenilmemiş kayıtlar (+ isteği zaten gönderdi mi).
create or replace function public.my_unclaimed_matches()
returns table(id uuid, pet_name text, clinic_name text, requested boolean)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare v_phone text;
begin
    if auth.uid() is null then raise exception 'Giriş gerekli' using errcode = '42501'; end if;
    select normalize_tr_phone(phone) into v_phone from profiles where profiles.id = auth.uid();
    if v_phone is null then return; end if;
    return query
    select up.id, up.pet_name::text, coalesce(b.name, 'Klinik')::text, coalesce(up.claim_requested_by = auth.uid(), false)
      from unclaimed_patients up
      left join businesses b on b.id::text = up.clinic_id
     where up.normalized_phone = v_phone
       and up.status in ('unclaimed', 'sms_sent')
       and (up.claim_requested_by is null or up.claim_requested_by = auth.uid());
end $$;

revoke execute on function public.my_unclaimed_matches() from public, anon;
grant execute on function public.my_unclaimed_matches() to authenticated;

-- Eski, numarayı parametre olarak alan fonksiyon kullanıcıya kapatılır (silinmesi Baran'ın SQL Editor'ında).
revoke execute on function public.check_unclaimed_matches(text) from public, anon, authenticated;

create or replace function public.request_manual_claim(p_unclaimed_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_phone text;
    v_rec unclaimed_patients;
begin
    if auth.uid() is null then raise exception 'Giriş gerekli' using errcode = '42501'; end if;
    select normalize_tr_phone(phone) into v_phone from profiles where id = auth.uid();
    select * into v_rec from unclaimed_patients where id = p_unclaimed_id for update;
    if not found or v_phone is null or v_rec.normalized_phone is distinct from v_phone
       or v_rec.status not in ('unclaimed', 'sms_sent') then
        raise exception 'Bu kayıt için istek gönderemezsin.' using errcode = '42501';
    end if;
    if v_rec.claim_requested_by = auth.uid() then return true; end if;
    if v_rec.claim_requested_by is not null then
        raise exception 'Bu kayıt için başka bir istek bekliyor.' using errcode = 'P0001';
    end if;

    update unclaimed_patients set claim_requested_by = auth.uid() where id = p_unclaimed_id;

    if v_rec.clinic_id ~* '^[0-9a-f-]{36}$' then
        perform notify_business(v_rec.clinic_id::uuid, null, 'biz_claim', 'Kayıt sahiplenme isteği',
            coalesce(v_rec.pet_name, 'Hasta') || ' kaydını sahibi Moffi hesabına almak istiyor. Hasta aktarımı ekranından onaylayabilirsin.',
            auth.uid(), p_unclaimed_id::text);
    end if;
    return true;
end $$;

revoke execute on function public.request_manual_claim(uuid) from public, anon;
grant execute on function public.request_manual_claim(uuid) to authenticated;
