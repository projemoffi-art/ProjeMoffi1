-- İşletme başvurusunda gerçek biçim doğrulaması (2026-10-04).
-- Eskiden telefon "10–15 rakam" (20 haneli uydurma numara da geçiyordu), vergi/T.C. no yalnızca hane sayısıyla denetleniyordu.
-- Aynı kurallar istemcide: src/lib/trIdentity.ts. Bu denetimler numaranın kurala uyduğunu gösterir; kime ait olduğu
-- başvuru incelemesinde (yönetici) doğrulanır.

-- T.C. kimlik no: 11 hane, ilk hane 0 değil, 10. ve 11. hane kontrol basamağı.
create or replace function public.tckn_is_valid(p text)
returns boolean language plpgsql immutable set search_path to 'public' as $$
declare s text := regexp_replace(coalesce(p, ''), '\D', '', 'g'); d int[]; i int;
begin
    if s !~ '^[1-9][0-9]{10}$' then return false; end if;
    d := array(select substr(s, g, 1)::int from generate_series(1, 11) g);
    if (((d[1] + d[3] + d[5] + d[7] + d[9]) * 7 - (d[2] + d[4] + d[6] + d[8])) % 10 + 10) % 10 <> d[10] then return false; end if;
    return (select sum(x) from unnest(d[1:10]) x) % 10 = d[11];
end $$;

-- Vergi kimlik no: 10 hane, son hane Gelir İdaresi kontrol basamağı.
create or replace function public.vkn_is_valid(p text)
returns boolean language plpgsql immutable set search_path to 'public' as $$
declare s text := regexp_replace(coalesce(p, ''), '\D', '', 'g'); i int; t int; r int; total int := 0;
begin
    if s !~ '^[0-9]{10}$' then return false; end if;
    for i in 0..8 loop
        t := (substr(s, i + 1, 1)::int + 9 - i) % 10;
        r := (t * (2 ^ (9 - i))::int) % 9;
        if t <> 0 and r = 0 then r := 9; end if;
        total := total + r;
    end loop;
    return (10 - total % 10) % 10 = substr(s, 10, 1)::int;
end $$;

-- Türkiye telefonu tek biçime: '+90XXXXXXXXXX' (sabit hat 2xx/3xx/4xx, cep 5xx, 850) ya da '444XXXX'; geçersizse null.
create or replace function public.tr_phone_e164(p text)
returns text language plpgsql immutable set search_path to 'public' as $$
declare s text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
    if s ~ '^444[0-9]{4}$' then return s; end if;
    if length(s) = 12 and left(s, 2) = '90' then s := substr(s, 3);
    elsif length(s) = 11 and left(s, 1) = '0' then s := substr(s, 2); end if;
    if s !~ '^([2-5][0-9]{2}|850)[0-9]{7}$' then return null; end if;
    return '+90' || s;
end $$;

-- Saf yardımcılar; RLS'de değil yalnızca fonksiyonlarda kullanılır.
revoke execute on function public.tckn_is_valid(text), public.vkn_is_valid(text), public.tr_phone_e164(text) from public, anon;
grant execute on function public.tckn_is_valid(text), public.vkn_is_valid(text), public.tr_phone_e164(text) to authenticated;

create or replace function public.submit_business_application(p_business uuid, p_type text, p_name text, p_owner_name text, p_phone text, p_tax_id text, p_iban text, p_address text, p_province text, p_district text, p_lat double precision, p_lng double precision)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
    v_uid uuid := auth.uid();
    v_id uuid;
    v_phone text := tr_phone_e164(p_phone);
    v_tax text := regexp_replace(coalesce(p_tax_id, ''), '\D', '', 'g');
    v_iban text := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));
    v_label text;
    a record;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    if not exists (select 1 from auth.users where id = v_uid and email_confirmed_at is not null) then
        raise exception 'Önce e-posta adresini doğrula';
    end if;

    v_label := case p_type when 'vet' then 'Veteriner kliniği' when 'grooming' then 'Pet kuaför' when 'trainer' then 'Eğitmen'
                           when 'shelter' then 'Barınak' when 'petshop' then 'Pet shop' end;
    if v_label is null then raise exception 'Geçersiz işletme türü'; end if;
    if char_length(trim(coalesce(p_name, ''))) not between 2 and 80 then raise exception 'İşletme adı 2–80 karakter olmalı'; end if;
    if char_length(trim(coalesce(p_owner_name, ''))) not between 2 and 80 then raise exception 'Yetkili adı 2–80 karakter olmalı'; end if;
    if v_phone is null then raise exception 'Geçerli bir Türkiye telefon numarası yaz (örn. 0532 123 45 67)'; end if;
    if length(v_tax) = 10 then
        if not vkn_is_valid(v_tax) then raise exception 'Vergi numarası geçerli değil; hanelerini kontrol et'; end if;
    elsif length(v_tax) = 11 then
        if not tckn_is_valid(v_tax) then raise exception 'T.C. kimlik numarası geçerli değil; hanelerini kontrol et'; end if;
    else
        raise exception 'Vergi numarası 10, T.C. kimlik numarası 11 hane olmalı';
    end if;
    if not iban_is_valid(v_iban) then raise exception 'IBAN geçerli değil (TR ile başlayan 26 karakter)'; end if;
    if char_length(trim(coalesce(p_address, ''))) not between 5 and 300 then raise exception 'Açık adresi yaz'; end if;
    if coalesce(trim(p_province), '') = '' or coalesce(trim(p_district), '') = '' then raise exception 'İl ve ilçe seç'; end if;
    if p_lat is null or p_lng is null or p_lat not between 35.5 and 42.5 or p_lng not between 25.5 and 45 then
        raise exception 'İşletmenin yerini haritada işaretle';
    end if;

    if p_business is null then
        if exists (select 1 from businesses b join business_members m on m.business_id = b.id
                    where m.user_id = v_uid and m.role = 'owner' and b.kyb_status = 'pending') then
            raise exception 'İncelemede bekleyen bir başvurun var; sonuçlanınca yenisini açabilirsin';
        end if;
        if (select count(*) from business_members where user_id = v_uid and role = 'owner') >= 5 then
            raise exception 'En fazla 5 işletmeye sahip olabilirsin';
        end if;
        insert into businesses (business_type, name, owner_name, phone, tax_id, iban, address, province, district, lat, lng,
                                approved, kyb_status, created_by)
        values (p_type, trim(p_name), trim(p_owner_name), v_phone, v_tax, v_iban, trim(p_address), trim(p_province), trim(p_district),
                p_lat, p_lng, false, 'pending', v_uid)
        returning id into v_id;
        insert into business_members (business_id, user_id, role) values (v_id, v_uid, 'owner');
        update profiles set active_business_id = v_id where id = v_uid;
    else
        if not exists (select 1 from business_members where business_id = p_business and user_id = v_uid and role = 'owner') then
            raise exception 'Bu başvuruyu yalnızca işletmenin sahibi düzenleyebilir';
        end if;
        update businesses set business_type = p_type, name = trim(p_name), owner_name = trim(p_owner_name), phone = v_phone,
               tax_id = v_tax, iban = v_iban, address = trim(p_address), province = trim(p_province), district = trim(p_district),
               lat = p_lat, lng = p_lng, kyb_status = 'pending', kyb_rejection_reason = null, updated_at = now()
         where id = p_business and kyb_status = 'rejected'
        returning id into v_id;
        if v_id is null then raise exception 'Yalnızca reddedilmiş başvuru yeniden gönderilebilir'; end if;
    end if;

    for a in select id from profiles where role = 'admin' loop
        perform notify_user(a.id, 'admin_business', 'Yeni işletme başvurusu', trim(p_name) || ' · ' || v_label || ' · ' || trim(p_province),
                            v_uid, v_id::text);
    end loop;
    return v_id;
end;
$function$;
