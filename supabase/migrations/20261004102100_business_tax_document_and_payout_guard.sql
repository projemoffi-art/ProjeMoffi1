-- İşletme başvurusu: vergi levhası zorunlu, IBAN yalnızca satış yapan işletmeden (pet shop) — Baran kararı 2026-10-04.
-- Yolda bulunan açıklar: (1) sahip VE yönetici, uygulamayı atlayıp businesses.iban / tax_id / owner_name'i doğrudan
-- değiştirebiliyordu (doğrulama ve yeniden inceleme yok; davetli bir yönetici ödemeleri kendi hesabına çevirebilirdi);
-- (2) işletme profilinden telefon doğrulamasız yazılıyordu; (3) ürün ekleme her işletme türüne ve onaysız işletmeye açıktı.

-- (1) Kimlik ve ödeme alanları yalnızca sunucu fonksiyonlarından değişir.
revoke update (iban, tax_id, owner_name) on public.businesses from authenticated;

alter table public.businesses add column if not exists tax_certificate_path text;
comment on column public.businesses.tax_certificate_path is 'business-docs deposunda vergi levhası (<kullanıcı>/<dosya>); yalnızca sahibi ve yönetici okur.';

-- Vergi levhası deposu: özel, PDF ya da fotoğraf, en çok 10 MB. Yalnızca kendi klasörüne yükler; sahibi ve yönetici okur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-docs', 'business-docs', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Business docs: owner uploads" on storage.objects for insert to authenticated
    with check (bucket_id = 'business-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Business docs: owner or admin reads" on storage.objects for select to authenticated
    using (bucket_id = 'business-docs' and ((storage.foldername(name))[1] = auth.uid()::text or is_platform_admin()));
create policy "Business docs: owner deletes" on storage.objects for delete to authenticated
    using (bucket_id = 'business-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Satış yapabilen işletme: pet shop + onaylı + IBAN'lı. Ürün ekleme/güncelleme buna bağlı.
create or replace function public.business_can_sell(p_business uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from businesses where id = p_business and business_type = 'petshop' and approved and iban is not null);
$$;
revoke execute on function public.business_can_sell(uuid) from public, anon;
grant execute on function public.business_can_sell(uuid) to authenticated;

alter policy "Owner kendi ürününü yönetir" on public.products
    with check (can_manage_business(owner_id) and business_can_sell(owner_id));

-- (2) Profilden değişen telefon/ad/konum da başvurudaki kurallarla denetlenir (kullanıcı yazımında).
create or replace function public.businesses_guard_contact()
returns trigger language plpgsql security invoker set search_path to 'public' as $$
begin
    if current_user not in ('authenticated', 'anon') then return new; end if;
    if new.phone is distinct from old.phone and new.phone is not null then
        new.phone := tr_phone_e164(new.phone);
        if new.phone is null then raise exception 'Geçerli bir Türkiye telefon numarası yaz (örn. 0532 123 45 67)'; end if;
    end if;
    if new.name is distinct from old.name and char_length(trim(coalesce(new.name, ''))) not between 2 and 80 then
        raise exception 'İşletme adı 2–80 karakter olmalı';
    end if;
    if (new.lat is distinct from old.lat or new.lng is distinct from old.lng) and new.lat is not null
       and (new.lat not between 35.5 and 42.5 or new.lng not between 25.5 and 45) then
        raise exception 'İşletmenin yeri Türkiye sınırları içinde olmalı';
    end if;
    return new;
end $$;
create trigger businesses_guard_contact before update on public.businesses
    for each row execute function public.businesses_guard_contact();

-- Başvuru: vergi levhası zorunlu (kendi klasöründe, gerçekten yüklenmiş), IBAN yalnızca pet shop'ta zorunlu, diğerlerinde tutulmaz.
create or replace function public.submit_business_application(p_business uuid, p_type text, p_name text, p_owner_name text, p_phone text, p_tax_id text, p_iban text, p_address text, p_province text, p_district text, p_lat double precision, p_lng double precision, p_tax_document text)
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
    v_iban text := nullif(upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g')), '');
    v_doc text := nullif(trim(coalesce(p_tax_document, '')), '');
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
    -- IBAN: satış yapan işletmede (pet shop) ödeme için zorunlu; diğer türlerde gerekmediği için tutulmaz (KVKK ölçülülük).
    if p_type = 'petshop' then
        if not iban_is_valid(v_iban) then raise exception 'IBAN geçerli değil (TR ile başlayan 26 karakter)'; end if;
    else
        v_iban := null;
    end if;
    if v_doc is null or split_part(v_doc, '/', 1) <> v_uid::text
       or not exists (select 1 from storage.objects where bucket_id = 'business-docs' and name = v_doc) then
        raise exception 'Vergi levhasını yükle (PDF ya da fotoğraf)';
    end if;
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
        insert into businesses (business_type, name, owner_name, phone, tax_id, iban, tax_certificate_path, address, province, district, lat, lng,
                                approved, kyb_status, created_by)
        values (p_type, trim(p_name), trim(p_owner_name), v_phone, v_tax, v_iban, v_doc, trim(p_address), trim(p_province), trim(p_district),
                p_lat, p_lng, false, 'pending', v_uid)
        returning id into v_id;
        insert into business_members (business_id, user_id, role) values (v_id, v_uid, 'owner');
        update profiles set active_business_id = v_id where id = v_uid;
    else
        if not exists (select 1 from business_members where business_id = p_business and user_id = v_uid and role = 'owner') then
            raise exception 'Bu başvuruyu yalnızca işletmenin sahibi düzenleyebilir';
        end if;
        update businesses set business_type = p_type, name = trim(p_name), owner_name = trim(p_owner_name), phone = v_phone,
               tax_id = v_tax, iban = v_iban, tax_certificate_path = v_doc, address = trim(p_address), province = trim(p_province),
               district = trim(p_district), lat = p_lat, lng = p_lng, kyb_status = 'pending', kyb_rejection_reason = null, updated_at = now()
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

revoke execute on function public.submit_business_application(uuid, text, text, text, text, text, text, text, text, text, double precision, double precision, text) from public, anon;
grant execute on function public.submit_business_application(uuid, text, text, text, text, text, text, text, text, text, double precision, double precision, text) to authenticated;

-- Eski 12 parametreli sürüm vergi levhasını denetlemez: kullanıcıya kapatılır (silinmesi ayrı parça, 20261004102101).
revoke execute on function public.submit_business_application(uuid, text, text, text, text, text, text, text, text, text, double precision, double precision) from public, anon, authenticated;
