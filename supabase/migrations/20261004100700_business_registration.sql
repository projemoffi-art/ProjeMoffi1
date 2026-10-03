-- İşletme kaydı ve onayı (2026-10-03, genel kontrolde bulundu). 8.54'te işletmeler ayrı kayda (businesses + business_members)
-- taşınmıştı ama yeni işletme OLUŞTURAN hiçbir yol yoktu (kayıt ekranı eski profil kolonlarına yazıyordu, tetikleyiciler geri alıyordu)
-- ve yönetici onayı servis rolüyle yazıyordu (servis rolünün businesses'a yazma yetkisi yok → onay da çalışmıyordu).
--
-- submit_business_application: giriş yapmış, e-postası doğrulanmış kişi başvurur (p_business null = yeni; dolu = reddedilmiş
--   başvurusunu düzeltip yeniden gönderir). İşletme onaysız açılır, kişi sahibi olur, yöneticilere bildirim gider.
-- admin_review_business: yalnızca yönetici + iki adımlı doğrulama (aal2). Karar işletmeye bildirim + e-posta.

create or replace function public.iban_is_valid(p_iban text)
returns boolean
language plpgsql
immutable
set search_path to 'public'
as $$
declare s text; d text := ''; c text; r integer := 0; i integer;
begin
    s := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));
    if s !~ '^TR[0-9]{24}$' then return false; end if;
    s := substr(s, 5) || substr(s, 1, 4);
    for i in 1..length(s) loop
        c := substr(s, i, 1);
        d := d || case when c ~ '[A-Z]' then (ascii(c) - 55)::text else c end;
    end loop;
    for i in 1..length(d) loop
        r := (r * 10 + substr(d, i, 1)::integer) % 97;
    end loop;
    return r = 1;
end;
$$;

create or replace function public.submit_business_application(
    p_business uuid,
    p_type text,
    p_name text,
    p_owner_name text,
    p_phone text,
    p_tax_id text,
    p_iban text,
    p_address text,
    p_province text,
    p_district text,
    p_lat double precision,
    p_lng double precision
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_uid uuid := auth.uid();
    v_id uuid;
    v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
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
    if v_phone !~ '^\+?[0-9]{10,15}$' then raise exception 'Geçerli bir telefon numarası yaz'; end if;
    if v_tax !~ '^[0-9]{10,11}$' then raise exception 'Vergi numarası 10, T.C. kimlik numarası 11 hane olmalı'; end if;
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
$$;

create or replace function public.admin_review_business(p_business uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_name text;
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then raise exception 'Bu işlem için iki adımlı doğrulama gerekli'; end if;
    if not p_approve and char_length(coalesce(trim(p_reason), '')) < 5 then raise exception 'Ret nedenini yaz (işletme bunu görür)'; end if;

    update businesses
       set approved = p_approve,
           kyb_status = case when p_approve then 'approved' else 'rejected' end,
           kyb_rejection_reason = case when p_approve then null else left(trim(p_reason), 500) end,
           updated_at = now()
     where id = p_business
    returning name into v_name;
    if v_name is null then raise exception 'İşletme bulunamadı'; end if;

    perform notify_business(p_business, null, 'biz_kyb',
        case when p_approve then 'İşletmen onaylandı' else 'İşletme başvurun onaylanmadı' end,
        case when p_approve then v_name || ' artık Moffi''de görünür; panelin tüm özellikleriyle açık.'
             else 'Neden: ' || trim(p_reason) || ' · Bilgilerini düzeltip yeniden gönderebilirsin.' end,
        auth.uid(), p_business::text);
end;
$$;

-- İşletme kararı e-postayla da gider (bildirim omurgası tek yer: notify_business).
create or replace function public.notify_business(p_business uuid, p_doctor uuid, p_type text, p_title text, p_content text, p_actor uuid, p_entity_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare r record;
begin
    if p_business is null then return; end if;
    for r in select m.user_id from business_members m
              where m.business_id = p_business
                and (m.role in ('owner', 'manager') or (m.role = 'staff' and p_doctor is not null and m.doctor_id = p_doctor)) loop
        continue when r.user_id = p_actor;
        insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read, business_id)
        values (r.user_id, p_type, p_title, p_content, p_actor, p_entity_id, false, p_business);
        if p_type in ('biz_appointment', 'biz_order', 'biz_kyb') then
            perform enqueue_email(r.user_id, 'Moffi · ' || p_title, p_title, p_content,
                case when p_type = 'biz_appointment' then '/business/calendar'
                     when p_type = 'biz_kyb' then '/business/dashboard'
                     else '/business/orders' end);
        end if;
    end loop;
end;
$$;

-- Yöneticiye yeni başvuru e-postası (gövde aynı; yalnızca 'admin_business' türü eklendi).
create or replace function public.notify_user(p_user_id uuid, p_type text, p_title text, p_content text, p_actor_id uuid, p_entity_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_is_business boolean;
begin
  if p_user_id is null or p_user_id = p_actor_id then return; end if;
  insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
  values (p_user_id, p_type, p_title, p_content, p_actor_id, p_entity_id, false);
  if p_type in ('appointment', 'order', 'health', 'sos', 'lost_sighting', 'adoption_application', 'adoption_update', 'pet_transfer', 'staff_invitation', 'admin_business') then
    select role = 'business' into v_is_business from profiles where id = p_user_id;
    perform enqueue_email(p_user_id, 'Moffi · ' || p_title, p_title, p_content,
      case
        when p_type = 'health' then '/health'
        when p_type = 'sos' then '/pasaport'
        when p_type = 'lost_sighting' then '/kayip/' || p_entity_id || '/yonet'
        when p_type = 'adoption_application' then '/sahiplendirme/basvuru/' || p_entity_id
        when p_type in ('adoption_update', 'pet_transfer') then '/sahiplendirme/basvurularim'
        when p_type = 'staff_invitation' then '/invitation/' || p_entity_id
        when p_type = 'admin_business' then '/admin/businesses'
        when p_type = 'appointment' and coalesce(v_is_business, false) then '/business/calendar'
        when p_type = 'appointment' then '/vet'
        when coalesce(v_is_business, false) then '/business/orders'
        else '/petshop'
      end);
  end if;
end;
$$;

revoke execute on function public.iban_is_valid(text) from public, anon;
grant execute on function public.iban_is_valid(text) to authenticated;
revoke execute on function public.submit_business_application(uuid, text, text, text, text, text, text, text, text, text, double precision, double precision) from public, anon;
grant execute on function public.submit_business_application(uuid, text, text, text, text, text, text, text, text, text, double precision, double precision) to authenticated;
revoke execute on function public.admin_review_business(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_business(uuid, boolean, text) to authenticated;
