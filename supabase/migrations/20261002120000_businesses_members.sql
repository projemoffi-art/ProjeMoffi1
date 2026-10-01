-- 1b (yol haritası 8.52): hesap = kişi, işletme = ayrı kayıt.
-- İşletme bilgisi `businesses`'a, kimin yönetebileceği `business_members`'a taşınır. Mevcut işletmeler AYNI kimlikle
-- taşındığı için randevu/sipariş/hizmet kayıtlarındaki bağlantılar değişmez; sadece yabancı anahtarların hedefi
-- profiles yerine businesses olur. Yetki kontrolleri "giriş yapan kişi = işletme" yerine "kişi bu işletmenin üyesi mi".
-- Bu adım geriye uyumludur: profiles'taki eski işletme kolonları ve role='business' bir sonraki temizlik
-- migration'ına kadar durur (istemci yeni yapıya geçince kaldırılır).

-- 0) Ağustos 2026 test kalıntıları (Baran onayıyla, 2026-10-02): işletme olmayan hesaplara bağlı 2 test randevusu
--    ve yönetici hesabındaki 4 deneme ürünü. Muayene kayıtlarının randevu bağlantısı ON DELETE SET NULL ile boşalır.
delete from public.appointments
 where clinic_id in ('c4189f3b-ec84-4cf8-aeb9-689715e22b57', '0dc5387e-7691-4f9b-a35b-cec20121ef87');
delete from public.cart_items
 where product_id in (select id::text from public.products where owner_id = '0dc5387e-7691-4f9b-a35b-cec20121ef87');
-- Bu deneme ürünlerinden birinin ödemesi hiç alınmamış test siparişi (10 Haziran, alıcı: projemoffi) da gider;
-- order_items.product_id boş bırakılamadığı için ürünle birlikte silinmesi gerekiyor.
create temp table _test_orders on commit drop as
    select distinct oi.order_id from public.order_items oi
     where oi.product_id in (select id from public.products where owner_id = '0dc5387e-7691-4f9b-a35b-cec20121ef87');
delete from public.order_items
 where product_id in (select id from public.products where owner_id = '0dc5387e-7691-4f9b-a35b-cec20121ef87');
delete from public.orders o
 where o.id in (select order_id from _test_orders)
   and not exists (select 1 from public.order_items oi where oi.order_id = o.id);
delete from public.products where owner_id = '0dc5387e-7691-4f9b-a35b-cec20121ef87';

-- 1) İşletme kaydı -------------------------------------------------------------------------------------
create table if not exists public.businesses (
    id uuid primary key default gen_random_uuid(),
    business_type varchar(50) check (business_type in ('petshop', 'vet', 'grooming', 'trainer', 'shelter')),
    name varchar(150) not null check (char_length(btrim(name)) >= 2),
    approved boolean not null default false,
    kyb_status varchar(50) not null default 'pending' check (kyb_status in ('pending', 'approved', 'rejected')),
    kyb_rejection_reason text,
    tax_id varchar(50),
    iban varchar(50),
    owner_name varchar(150),
    phone varchar(20),
    website text,
    description text,
    logo_url text,
    cover_url text,
    gallery_urls text[] not null default '{}',
    address text,
    province text,
    district text,
    lat numeric,
    lng numeric,
    working_hours jsonb,
    cancellation_notice_hours integer not null default 0 check (cancellation_notice_hours between 0 and 168),
    onboarding_completed boolean not null default false,
    settings jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists businesses_type_approved_idx on public.businesses (business_type, approved);

create table if not exists public.business_members (
    business_id uuid not null references public.businesses(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'manager', 'staff')),
    doctor_id uuid references public.doctors(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (business_id, user_id)
);
create index if not exists business_members_user_idx on public.business_members (user_id);
create unique index if not exists business_members_one_owner on public.business_members (business_id) where role = 'owner';

alter table public.profiles add column if not exists active_business_id uuid references public.businesses(id) on delete set null;
alter table public.notifications add column if not exists business_id uuid references public.businesses(id) on delete cascade;
create index if not exists notifications_business_idx on public.notifications (business_id, created_at desc) where business_id is not null;

-- 2) Mevcut işletmeleri aynı kimlikle taşı; eski işletme hesabı sahibi olur ------------------------------
insert into public.businesses (id, business_type, name, approved, kyb_status, kyb_rejection_reason, tax_id, iban, owner_name,
                               phone, website, description, logo_url, cover_url, gallery_urls, address, province, district,
                               lat, lng, working_hours, cancellation_notice_hours, onboarding_completed, created_by, created_at)
select p.id, p.business_type, coalesce(nullif(btrim(p.business_name), ''), nullif(btrim(p.full_name), ''), 'İşletme'),
       coalesce(p.business_approved, false), coalesce(p.kyb_status, 'pending'), p.kyb_rejection_reason, p.tax_id, p.iban, p.owner_name,
       p.phone, p.website, p.bio, p.avatar_url, p.cover_url, coalesce(p.gallery_urls, '{}'), p.address, p.province, p.district,
       p.business_lat, p.business_lng, p.working_hours, coalesce(p.cancellation_notice_hours, 0), coalesce(p.onboarding_completed, false),
       p.id, coalesce(p.created_at, now())
  from public.profiles p
 where p.role = 'business'
on conflict (id) do nothing;

insert into public.business_members (business_id, user_id, role)
select b.id, b.id, 'owner' from public.businesses b
 where exists (select 1 from auth.users u where u.id = b.id)
on conflict do nothing;

update public.profiles p set active_business_id = p.id
 where p.active_business_id is null and exists (select 1 from public.businesses b where b.id = p.id);

-- 3) Yetki yardımcıları (tek yerde) ---------------------------------------------------------------------
create or replace function public.business_member_role(p_business uuid)
returns text language sql stable security definer set search_path to 'public' as $$
    select role from business_members where business_id = p_business and user_id = auth.uid();
$$;

create or replace function public.is_business_member(p_business uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from business_members where business_id = p_business and user_id = auth.uid());
$$;

create or replace function public.can_manage_business(p_business uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from business_members where business_id = p_business and user_id = auth.uid() and role in ('owner', 'manager'));
$$;

-- Metin tipindeki eski clinic_id kolonları için (clinic_settings, medical_records, unclaimed_patients, vet_advices, sms).
create or replace function public.is_business_member_t(p_business text)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select p_business ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and is_business_member(p_business::uuid);
$$;
create or replace function public.can_manage_business_t(p_business text)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select p_business ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and can_manage_business(p_business::uuid);
$$;

create or replace function public.staff_doctor_id(p_business uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
    select doctor_id from business_members where business_id = p_business and user_id = auth.uid() and role = 'staff';
$$;

-- Sahip/yönetici işletmenin tüm randevularını; personel sadece kendisine bağlı personel kaydının randevularını yönetir.
create or replace function public.can_handle_appointment(p_business uuid, p_doctor uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from business_members m
                    where m.business_id = p_business and m.user_id = auth.uid()
                      and (m.role in ('owner', 'manager') or (m.role = 'staff' and p_doctor is not null and m.doctor_id = p_doctor)));
$$;

-- Kişinin şu an adına çalıştığı işletme: seçtiği (üyeyse), yoksa sahibi olduğu, yoksa ilk üyeliği.
create or replace function public.current_business_id()
returns uuid language sql stable security definer set search_path to 'public' as $$
    select coalesce(
        (select p.active_business_id from profiles p
           join business_members m on m.business_id = p.active_business_id and m.user_id = p.id
          where p.id = auth.uid()),
        (select m.business_id from business_members m where m.user_id = auth.uid()
          order by (m.role = 'owner') desc, (m.role = 'manager') desc, m.created_at limit 1));
$$;

create or replace function public.set_active_business(p_business uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    if p_business is not null and not is_business_member(p_business) then raise exception 'Bu işletmenin üyesi değilsin'; end if;
    update profiles set active_business_id = p_business where id = auth.uid();
end;
$$;

-- Kişinin üyesi olduğu işletmeler (panel geçişi ve ara katman için).
create or replace function public.my_businesses()
returns table (id uuid, name text, business_type text, approved boolean, kyb_status text, role text, logo_url text, is_active boolean)
language sql stable security definer set search_path to 'public' as $$
    select b.id, b.name::text, b.business_type::text, b.approved, b.kyb_status::text, m.role, b.logo_url, b.id = current_business_id()
      from business_members m join businesses b on b.id = m.business_id
     where m.user_id = auth.uid()
     order by (m.role = 'owner') desc, b.created_at;
$$;

-- İşletmeye giden bildirim: sahip ve yöneticilere; personele sadece kendi randevusu. Kişisel bildirimlerden ayrı tutulur.
create or replace function public.notify_business(p_business uuid, p_doctor uuid, p_type text, p_title text, p_content text, p_actor uuid, p_entity_id text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r record;
begin
    if p_business is null then return; end if;
    for r in select m.user_id from business_members m
              where m.business_id = p_business
                and (m.role in ('owner', 'manager') or (m.role = 'staff' and p_doctor is not null and m.doctor_id = p_doctor)) loop
        continue when r.user_id = p_actor;
        insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read, business_id)
        values (r.user_id, p_type, p_title, p_content, p_actor, p_entity_id, false, p_business);
        if p_type in ('biz_appointment', 'biz_order') then
            perform enqueue_email(r.user_id, 'Moffi · ' || p_title, p_title, p_content,
                case when p_type = 'biz_appointment' then '/business/calendar' else '/business/orders' end);
        end if;
    end loop;
end;
$$;

do $$ declare f text; begin
    foreach f in array array['business_member_role(uuid)', 'is_business_member(uuid)', 'can_manage_business(uuid)', 'is_business_member_t(text)',
        'can_manage_business_t(text)', 'staff_doctor_id(uuid)', 'can_handle_appointment(uuid, uuid)', 'current_business_id()',
        'set_active_business(uuid)', 'my_businesses()',
        'notify_business(uuid, uuid, text, text, text, uuid, text)'] loop
        execute format('revoke all on function public.%s from public', f);
    end loop;
end $$;
grant execute on function public.current_business_id() to authenticated;
grant execute on function public.set_active_business(uuid) to authenticated;
grant execute on function public.my_businesses() to authenticated;
grant execute on function public.business_member_role(uuid) to authenticated;
grant execute on function public.is_business_member(uuid), public.can_manage_business(uuid), public.is_business_member_t(text),
    public.can_manage_business_t(text), public.staff_doctor_id(uuid), public.can_handle_appointment(uuid, uuid) to authenticated, anon;

-- 4) Erişim kuralları: işletme kaydı ve üyelik ---------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

drop policy if exists "Businesses: members and admin read" on public.businesses;
drop policy if exists "Businesses: managers update" on public.businesses;
create policy "Businesses: members and admin read" on public.businesses for select to authenticated
    using (is_business_member(id) or get_my_role() = 'admin');
create policy "Businesses: managers update" on public.businesses for update to authenticated
    using (can_manage_business(id)) with check (can_manage_business(id));
revoke all on public.businesses from anon, authenticated;
grant select on public.businesses to authenticated;
-- Onay, KYB durumu ve tür sadece yönetici/sunucu tarafından değişir.
grant update (name, owner_name, phone, website, description, logo_url, cover_url, gallery_urls, address, province, district,
              lat, lng, working_hours, cancellation_notice_hours, onboarding_completed, settings, tax_id, iban) on public.businesses to authenticated;

create or replace function public.businesses_touch()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists businesses_touch on public.businesses;
create trigger businesses_touch before update on public.businesses for each row execute function public.businesses_touch();

drop policy if exists "Business members: team reads" on public.business_members;
create policy "Business members: team reads" on public.business_members for select to authenticated
    using (user_id = auth.uid() or is_business_member(business_id));
revoke all on public.business_members from anon, authenticated;
grant select on public.business_members to authenticated;

-- Herkese açık işletme kartı (onaylı olanlar; üyeler kendi onaysız işletmesini de görür). IBAN/vergi no yok.
create or replace view public.business_cards as
select b.id, b.business_type::text as business_type, b.name::text as name, b.approved, b.description, b.logo_url, b.cover_url,
       b.gallery_urls, b.phone::text as phone, b.website, b.address, b.province, b.district,
       b.lat::double precision as lat, b.lng::double precision as lng, b.working_hours, b.cancellation_notice_hours, b.created_at
  from public.businesses b
 where b.approved or is_business_member(b.id) or get_my_role() = 'admin';
revoke all on public.business_cards from anon, authenticated;
grant select on public.business_cards to anon, authenticated;

-- profile_cards geriye uyumlu: işletme kolonları artık businesses'tan okunur (temizlik migration'ında kaldırılacak).
create or replace view public.profile_cards as
select p.id, p.username, p.full_name, p.avatar_url, coalesce(b.cover_url, p.cover_url) as cover_url, p.bio, p.role, p.account_status,
       p.created_at, p.last_seen_at, p.aura_settings, p.pet_name, p.default_allow_comments, p.default_comment_privacy,
       b.business_type, b.name as business_name, b.approved as business_approved,
       coalesce(b.province, p.province) as province, coalesce(b.district, p.district) as district,
       b.lat as business_lat, b.lng as business_lng, b.working_hours, b.website, b.gallery_urls, b.cancellation_notice_hours,
       case when b.id is not null then b.phone end as phone,
       case when b.id is not null then b.address end as address
  from public.profiles p
  left join public.businesses b on b.id = p.id;

-- 5) Yabancı anahtarlar: işletme kolonları profiles yerine businesses'a bağlanır (değerler aynı) ---------------
do $$ declare r record; v_def text; begin
    for r in
        select c.conname, c.conrelid::regclass as tbl, pg_get_constraintdef(c.oid) as def
          from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
         where c.contype = 'f' and c.confrelid = 'public.profiles'::regclass
           and (a.attname in ('clinic_id', 'business_id') or (c.conrelid = 'public.products'::regclass and a.attname = 'owner_id'))
    loop
        v_def := replace(r.def, 'REFERENCES profiles(id)', 'REFERENCES businesses(id)');
        if v_def = r.def then raise exception 'Beklenmeyen kısıt tanımı: % %', r.conname, r.def; end if;
        execute format('alter table %s drop constraint %I', r.tbl, r.conname);
        execute format('alter table %s add constraint %I %s', r.tbl, r.conname, v_def);
    end loop;
end $$;
-- Aynı kolonda iki kez tanımlı randevu kısıtı tekleşir.
do $$ declare r record; n int := 0; begin
    for r in select conname from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
              where c.contype = 'f' and c.conrelid = 'public.appointments'::regclass and a.attname = 'clinic_id' order by conname loop
        n := n + 1;
        if n > 1 then execute format('alter table public.appointments drop constraint %I', r.conname); end if;
    end loop;
end $$;
alter table public.clinic_client_notes drop constraint if exists clinic_client_notes_clinic_id_fkey;
alter table public.clinic_client_notes add constraint clinic_client_notes_clinic_id_fkey foreign key (clinic_id) references public.businesses(id) on delete cascade;
alter table public.doctor_time_off drop constraint if exists doctor_time_off_clinic_id_fkey;
alter table public.doctor_time_off add constraint doctor_time_off_clinic_id_fkey foreign key (clinic_id) references public.businesses(id) on delete cascade;

-- 6) Tablo kuralları: "giriş yapan = işletme" → üyelik ------------------------------------------------------
drop policy if exists "Allow select for owner or clinic" on public.appointments;
create policy "Allow select for owner or clinic" on public.appointments for select to authenticated
    using (auth.uid() = user_id or can_handle_appointment(clinic_id, doctor_id));

drop policy if exists "Herkes aktif kampanyalari okuyabilir" on public.business_deals;
drop policy if exists "Isletmeler kendi kampanyalarini ekleyebilir" on public.business_deals;
drop policy if exists "Isletmeler kendi kampanyalarini guncelleyebilir" on public.business_deals;
drop policy if exists "Isletmeler kendi kampanyalarini silebilir" on public.business_deals;
create policy "Herkes aktif kampanyalari okuyabilir" on public.business_deals for select using (status = 'active' or is_business_member(business_id));
create policy "Isletmeler kendi kampanyalarini ekleyebilir" on public.business_deals for insert with check (can_manage_business(business_id));
create policy "Isletmeler kendi kampanyalarini guncelleyebilir" on public.business_deals for update using (can_manage_business(business_id)) with check (can_manage_business(business_id));
create policy "Isletmeler kendi kampanyalarini silebilir" on public.business_deals for delete using (can_manage_business(business_id));

drop policy if exists "Analitik okuma yetkisi" on public.deal_analytics;
create policy "Analitik okuma yetkisi" on public.deal_analytics for select
    using (auth.uid() = user_id or can_manage_business((select d.business_id from business_deals d where d.id = deal_analytics.deal_id)));

drop policy if exists "Clinics can manage their own campaigns" on public.campaigns;
create policy "Clinics can manage their own campaigns" on public.campaigns for all to authenticated
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Klinik kendi kampanyasını yönetir" on public.clinic_campaigns;
create policy "Klinik kendi kampanyasını yönetir" on public.clinic_campaigns for all
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Clinic manages own client notes" on public.clinic_client_notes;
create policy "Clinic manages own client notes" on public.clinic_client_notes for all to authenticated
    using (is_business_member(clinic_id)) with check (is_business_member(clinic_id));

drop policy if exists "Klinik kendi yorumuna yanıt verir" on public.clinic_reviews;
create policy "Klinik kendi yorumuna yanıt verir" on public.clinic_reviews for update
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Klinik kendi istisnasını yönetir" on public.clinic_schedule_exceptions;
create policy "Klinik kendi istisnasını yönetir" on public.clinic_schedule_exceptions for all
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Klinik kendi hizmetini yönetir" on public.clinic_services;
create policy "Klinik kendi hizmetini yönetir" on public.clinic_services for all
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Allow all for authenticated/anon on clinic_settings" on public.clinic_settings;
create policy "Clinic settings: managers" on public.clinic_settings for all to authenticated
    using (can_manage_business_t(clinic_id)) with check (can_manage_business_t(clinic_id));

drop policy if exists "Clinic manages own staff time off" on public.doctor_time_off;
create policy "Clinic manages own staff time off" on public.doctor_time_off for all to authenticated
    using (can_manage_business(clinic_id))
    with check (can_manage_business(clinic_id) and exists (select 1 from doctors d where d.id = doctor_time_off.doctor_id and d.clinic_id = doctor_time_off.clinic_id));

drop policy if exists "Klinik kendi doktorlarını yönetir" on public.doctors;
create policy "Klinik kendi doktorlarını yönetir" on public.doctors for all
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Clinics can read their own created records" on public.medical_records;
create policy "Clinics can read their own created records" on public.medical_records for select to authenticated
    using (is_business_member_t(clinic_id));

drop policy if exists "Pets: clinic reads its patients" on public.pets;
create policy "Pets: clinic reads its patients" on public.pets for select to authenticated
    using (exists (select 1 from appointments a where a.pet_id = pets.id and can_handle_appointment(a.clinic_id, a.doctor_id)));

drop policy if exists "Owner kendi ürününü yönetir" on public.products;
create policy "Owner kendi ürününü yönetir" on public.products for all
    using (can_manage_business(owner_id)) with check (can_manage_business(owner_id));

drop policy if exists "Profiles: clinic reads its customers" on public.profiles;
create policy "Profiles: clinic reads its customers" on public.profiles for select to authenticated
    using (exists (select 1 from appointments a where a.user_id = profiles.id and can_handle_appointment(a.clinic_id, a.doctor_id)));

drop policy if exists "Clinics can manage their own quests" on public.quests;
create policy "Clinics can manage their own quests" on public.quests for all to authenticated
    using (can_manage_business(clinic_id)) with check (can_manage_business(clinic_id));

drop policy if exists "Clinic views own sms log" on public.sms_log;
create policy "Clinic views own sms log" on public.sms_log for select to authenticated using (can_manage_business_t(clinic_id));

drop policy if exists "Clinics can view their own transactions" on public.transactions;
create policy "Clinics can view their own transactions" on public.transactions for select to authenticated using (can_manage_business(clinic_id));

drop policy if exists "Vet advices: admin or own clinic writes" on public.vet_advices;
create policy "Vet advices: admin or own clinic writes" on public.vet_advices for all to authenticated
    using (get_my_role() = 'admin' or can_manage_business_t(clinic_id))
    with check (get_my_role() = 'admin' or can_manage_business_t(clinic_id));

-- 7) Sunucu fonksiyonları ---------------------------------------------------------------------------------
create or replace function public.business_display_name(p_id uuid)
returns text language sql stable security definer set search_path to 'public' as $$
    select coalesce((select nullif(btrim(name), '') from businesses where id = p_id), 'İşletme');
$$;

create or replace function public.appointment_policy_ok(p_clinic_id uuid, p_start timestamptz)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select p_start - wall_now() >= make_interval(hours => coalesce((select cancellation_notice_hours from businesses where id = p_clinic_id), 0));
$$;

create or replace function public.clinic_day_hours(p_clinic_id uuid, p_date date, out open_min integer, out close_min integer,
    out lunch_start_min integer, out lunch_end_min integer, out step_min integer)
returns record language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_day jsonb; v_ex record; v_cs record; v_key text := weekday_key(p_date);
begin
  select * into v_cs from clinic_settings where clinic_id = p_clinic_id::text;
  lunch_start_min := coalesce(hhmm_to_min(v_cs.lunch_start), 720);
  lunch_end_min := coalesce(hhmm_to_min(v_cs.lunch_end), 780);
  step_min := greatest(coalesce(v_cs.slot_duration, 30), 5);

  select working_hours -> v_key into v_day from businesses where id = p_clinic_id;
  select * into v_ex from clinic_schedule_exceptions where clinic_id = p_clinic_id and exception_date = p_date limit 1;

  if v_ex.id is not null then
    if v_ex.is_closed then return; end if;
    open_min := coalesce(hhmm_to_min(v_ex.open_time), hhmm_to_min(v_day ->> 'open'), hhmm_to_min(v_cs.start_time), 540);
    close_min := coalesce(hhmm_to_min(v_ex.close_time), hhmm_to_min(v_day ->> 'close'), hhmm_to_min(v_cs.end_time), 1080);
  elsif v_day is not null then
    if coalesce((v_day ->> 'closed')::boolean, false) then return; end if;
    open_min := coalesce(hhmm_to_min(v_day ->> 'open'), 540);
    close_min := coalesce(hhmm_to_min(v_day ->> 'close'), 1080);
  else
    if v_key in ('saturday', 'sunday') then return; end if;
    open_min := coalesce(hhmm_to_min(v_cs.start_time), 540);
    close_min := coalesce(hhmm_to_min(v_cs.end_time), 1080);
  end if;
  if close_min <= open_min then open_min := null; close_min := null; end if;
end;
$$;

create or replace function public.appointments_before_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare f record;
begin
  if coalesce(current_setting('moffi.trusted_appointment_insert', true), '') = 'on' then
    return new;
  end if;
  if auth.uid() is not null then
    new.status := 'pending';
    new.attendance_status := null;
    new.status_reason := null;
    new.created_by := 'customer';
    new.unclaimed_patient_id := null;
    new.guest_name := null;
    new.guest_phone := null;
    new.guest_pet_name := null;
    if not exists (select 1 from businesses where id = new.clinic_id and approved) then
      raise exception 'Randevu yalnızca onaylı bir işletmeden alınabilir';
    end if;
    if new.duration_minutes is null or new.duration_minutes < 5 or new.duration_minutes > 480 then
      new.duration_minutes := 30;
    end if;
    select * into f from find_slot_doctor(new.clinic_id, new.appointment_date, new.duration_minutes, new.doctor_id);
    if not f.ok then
      raise exception 'Bu saat uygun değil veya az önce doldu' using errcode = '23P01';
    end if;
    if f.doctor_id is not null then
      new.doctor_id := f.doctor_id;
      select name into new.doctor_name from doctors where id = f.doctor_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.trigger_notify_new_appointment()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_name text;
begin
  if new.created_by = 'business' then return new; end if;
  select coalesce(full_name, username, 'Bir müşteri') into v_name from profiles where id = new.user_id;
  perform notify_business(new.clinic_id, new.doctor_id, 'biz_appointment', 'Yeni randevu talebi',
    v_name || ' randevu talep etti: ' || to_char(new.appointment_date at time zone 'UTC', 'DD.MM.YYYY HH24:MI'),
    new.user_id, new.id::text);
  return new;
end;
$$;

create or replace function public.transition_appointment(p_appointment_id uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  a appointments;
  v_uid uuid := auth.uid();
  v_as_clinic boolean;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_when text;
  v_title text;
  v_msg text;
  v_hours integer;
begin
  if v_uid is null then raise exception 'Giriş gerekli'; end if;

  select * into a from appointments where id = p_appointment_id for update;
  if not found then raise exception 'Randevu bulunamadı'; end if;
  v_as_clinic := can_handle_appointment(a.clinic_id, a.doctor_id);
  if not v_as_clinic and v_uid is distinct from a.user_id then
    raise exception 'Bu randevu üzerinde işlem yetkin yok';
  end if;
  if a.status = p_status then return; end if;

  if v_as_clinic then
    if not ((a.status = 'pending' and p_status in ('confirmed', 'rejected', 'cancelled', 'completed'))
         or (a.status = 'confirmed' and p_status in ('completed', 'cancelled'))) then
      raise exception 'Randevu "%" durumundan "%" durumuna geçirilemez', a.status, p_status;
    end if;
  else
    if p_status <> 'cancelled' then
      raise exception 'Bu işlemi sadece işletme yapabilir';
    end if;
    if a.status not in ('pending', 'confirmed') or a.attendance_status is not null then
      raise exception 'Bu randevu artık iptal edilemez';
    end if;
    if a.status = 'confirmed' and not appointment_policy_ok(a.clinic_id, a.appointment_date) then
      select cancellation_notice_hours into v_hours from businesses where id = a.clinic_id;
      raise exception 'Randevuya % saatten az kaldığı için uygulamadan iptal edilemez. İptal için işletmeyi arayabilirsin.', v_hours;
    end if;
  end if;

  update appointments set status = p_status, status_reason = v_reason,
         reschedule_requested_start = null, reschedule_requested_at = null
   where id = a.id;

  v_when := to_char(a.appointment_date at time zone 'UTC', 'DD.MM.YYYY HH24:MI');

  if v_as_clinic then
    v_title := case p_status
      when 'confirmed' then 'Randevun onaylandı'
      when 'rejected' then 'Randevun reddedildi'
      when 'cancelled' then 'Randevun işletme tarafından iptal edildi'
      when 'completed' then 'Randevun tamamlandı'
    end;
    v_msg := business_display_name(a.clinic_id) || ' · ' || v_when;
    if p_status = 'completed' then
      v_msg := v_msg || '. Ziyaret özetini görebilir ve deneyimini değerlendirebilirsin.';
    elsif v_reason is not null and p_status in ('rejected', 'cancelled') then
      v_msg := v_msg || '. Sebep: ' || v_reason;
    end if;
    perform notify_user(a.user_id, 'appointment', v_title, v_msg, null, a.id::text);
  else
    select coalesce(full_name, username, 'Bir müşteri') || ' randevusunu iptal etti: ' || v_when
      into v_msg from profiles where id = a.user_id;
    perform notify_business(a.clinic_id, a.doctor_id, 'biz_appointment', 'Randevu iptal edildi', v_msg, v_uid, a.id::text);
  end if;
end;
$$;

create or replace function public.set_appointment_attendance(p_appointment_id uuid, p_attendance text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a appointments;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if p_attendance is not null and p_attendance not in ('attended', 'no_show') then
    raise exception 'Geçersiz katılım durumu';
  end if;
  select * into a from appointments where id = p_appointment_id for update;
  if not found or not can_handle_appointment(a.clinic_id, a.doctor_id) then
    raise exception 'Bu randevu üzerinde işlem yetkin yok';
  end if;
  if a.status not in ('confirmed', 'completed') then
    raise exception 'Katılım sadece onaylı veya tamamlanmış randevularda işaretlenebilir';
  end if;
  if a.attendance_status is not distinct from p_attendance then return; end if;

  update appointments set attendance_status = p_attendance where id = a.id;

  if p_attendance = 'no_show' then
    perform notify_user(a.user_id, 'appointment', 'Randevuna gelmediğin işaretlendi',
      business_display_name(a.clinic_id) || ' · ' || to_char(a.appointment_date at time zone 'UTC', 'DD.MM.YYYY HH24:MI')
      || '. Bir yanlışlık varsa işletmeye mesaj atabilirsin.', null, a.id::text);
  end if;
end;
$$;

create or replace function public.reschedule_appointment(p_appointment_id uuid, p_new_start timestamptz, p_doctor_id uuid default null, p_ignore_hours boolean default false)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a appointments; v_slot record;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  select * into a from appointments where id = p_appointment_id for update;
  if not found or not can_handle_appointment(a.clinic_id, a.doctor_id) then raise exception 'Bu randevu üzerinde işlem yetkin yok'; end if;
  if a.status not in ('pending', 'confirmed') then raise exception 'Sadece bekleyen veya onaylı randevular yeniden planlanabilir'; end if;
  -- Personel randevuyu başka bir personele aktaramaz.
  if not can_manage_business(a.clinic_id) then p_doctor_id := a.doctor_id; end if;

  select * into v_slot from find_slot_doctor(a.clinic_id, p_new_start, a.duration_minutes, p_doctor_id, a.id, p_ignore_hours);
  if not v_slot.ok then
    raise exception 'Yeni saat uygun değil (kapalı saat, izin ya da başka bir randevuyla çakışıyor)' using errcode = '23P01';
  end if;

  update appointments set appointment_date = p_new_start,
         doctor_id = coalesce(v_slot.doctor_id, doctor_id),
         doctor_name = coalesce((select name from doctors where id = v_slot.doctor_id), doctor_name),
         reschedule_requested_start = null, reschedule_requested_at = null
   where id = a.id;

  if a.user_id is not null then
    perform notify_user(a.user_id, 'appointment', 'Randevu saatin değişti',
      business_display_name(a.clinic_id) || ' · ' || to_char(a.appointment_date at time zone 'UTC', 'DD.MM.YYYY HH24:MI')
      || ' → ' || to_char(p_new_start at time zone 'UTC', 'DD.MM.YYYY HH24:MI'), null, a.id::text);
  end if;
end;
$$;

create or replace function public.respond_reschedule(p_appointment_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a appointments; v_slot record;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  select * into a from appointments where id = p_appointment_id for update;
  if not found or not can_handle_appointment(a.clinic_id, a.doctor_id) then raise exception 'Bu randevu üzerinde işlem yetkin yok'; end if;
  if a.reschedule_requested_start is null then raise exception 'Bekleyen bir erteleme talebi yok'; end if;

  if p_accept then
    select * into v_slot from find_slot_doctor(a.clinic_id, a.reschedule_requested_start, a.duration_minutes, a.doctor_id, a.id, false);
    if not v_slot.ok and can_manage_business(a.clinic_id) then
      select * into v_slot from find_slot_doctor(a.clinic_id, a.reschedule_requested_start, a.duration_minutes, null, a.id, false);
    end if;
    if not v_slot.ok then
      raise exception 'İstenen saat artık uygun değil. Talebi reddedip müşteriye başka bir saat önerebilirsin.' using errcode = '23P01';
    end if;
    update appointments set appointment_date = a.reschedule_requested_start,
           doctor_id = coalesce(v_slot.doctor_id, doctor_id),
           doctor_name = coalesce((select name from doctors where id = v_slot.doctor_id), doctor_name),
           reschedule_requested_start = null, reschedule_requested_at = null
     where id = a.id;
    perform notify_user(a.user_id, 'appointment', 'Erteleme talebin kabul edildi',
      business_display_name(a.clinic_id) || ' · yeni saat ' || to_char(a.reschedule_requested_start at time zone 'UTC', 'DD.MM.YYYY HH24:MI'),
      null, a.id::text);
  else
    update appointments set reschedule_requested_start = null, reschedule_requested_at = null where id = a.id;
    perform notify_user(a.user_id, 'appointment', 'Erteleme talebin kabul edilmedi',
      business_display_name(a.clinic_id) || ' · randevun ' || to_char(a.appointment_date at time zone 'UTC', 'DD.MM.YYYY HH24:MI') || ' olarak kaldı.',
      null, a.id::text);
  end if;
end;
$$;

create or replace function public.request_reschedule(p_appointment_id uuid, p_new_start timestamptz)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a appointments; v_slot record; v_hours integer; v_who text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  select * into a from appointments where id = p_appointment_id for update;
  if not found or a.user_id is distinct from auth.uid() then raise exception 'Bu randevu üzerinde işlem yetkin yok'; end if;
  if a.status not in ('pending', 'confirmed') then raise exception 'Bu randevu ertelenemez'; end if;
  if a.status = 'confirmed' and not appointment_policy_ok(a.clinic_id, a.appointment_date) then
    select cancellation_notice_hours into v_hours from businesses where id = a.clinic_id;
    raise exception 'Randevuya % saatten az kaldığı için uygulamadan ertelenemez. İşletmeyi arayabilirsin.', v_hours;
  end if;
  select * into v_slot from find_slot_doctor(a.clinic_id, p_new_start, a.duration_minutes, null, a.id, false);
  if not v_slot.ok then
    raise exception 'Seçtiğin yeni saat uygun değil' using errcode = '23P01';
  end if;
  v_who := coalesce((select coalesce(full_name, username) from profiles where id = a.user_id), 'Müşteri');

  if a.status = 'pending' then
    -- Henüz onaylanmamış talep: doğrudan yeni saate taşınır, işletme yine onaylar.
    update appointments set appointment_date = p_new_start, doctor_id = v_slot.doctor_id,
           doctor_name = (select name from doctors where id = v_slot.doctor_id)
     where id = a.id;
    perform notify_business(a.clinic_id, v_slot.doctor_id, 'biz_appointment', 'Randevu talebinin saati değişti',
      v_who || ' · ' || to_char(a.appointment_date at time zone 'UTC', 'DD.MM HH24:MI') || ' → ' || to_char(p_new_start at time zone 'UTC', 'DD.MM.YYYY HH24:MI'),
      a.user_id, a.id::text);
  else
    update appointments set reschedule_requested_start = p_new_start, reschedule_requested_at = now() where id = a.id;
    perform notify_business(a.clinic_id, a.doctor_id, 'biz_appointment', 'Erteleme talebi',
      v_who || ' randevusunu ' || to_char(a.appointment_date at time zone 'UTC', 'DD.MM HH24:MI') || ' yerine '
      || to_char(p_new_start at time zone 'UTC', 'DD.MM.YYYY HH24:MI') || ' saatine almak istiyor.', a.user_id, a.id::text);
  end if;
end;
$$;

create or replace function public.create_business_appointment(p_start timestamptz, p_minutes integer, p_service_name text, p_doctor_id uuid default null,
    p_user_id uuid default null, p_pet_id uuid default null, p_guest_name text default null, p_guest_phone text default null,
    p_guest_pet_name text default null, p_guest_pet_species text default null, p_notes text default null, p_ignore_hours boolean default false)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  v_clinic uuid := current_business_id();
  v_minutes integer := least(greatest(coalesce(p_minutes, 30), 5), 480);
  v_slot record;
  v_unclaimed uuid;
  v_id uuid;
  v_guest_name text := nullif(trim(coalesce(p_guest_name, '')), '');
  v_guest_phone text := nullif(trim(coalesce(p_guest_phone, '')), '');
  v_pet_name text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if v_clinic is null then raise exception 'Bir işletmenin üyesi değilsin'; end if;
  if not exists (select 1 from businesses where id = v_clinic and approved) then
    raise exception 'Sadece onaylı işletmeler randevu oluşturabilir';
  end if;
  -- Personel sadece kendi takvimine randevu açar.
  if not can_manage_business(v_clinic) then
    p_doctor_id := staff_doctor_id(v_clinic);
    if p_doctor_id is null then raise exception 'Hesabın bir personel kaydına bağlı değil; yöneticine danış'; end if;
  end if;

  if p_user_id is not null then
    if not exists (select 1 from appointments where clinic_id = v_clinic and user_id = p_user_id)
       and not exists (select 1 from unclaimed_patients where clinic_id = v_clinic::text and claimed_by_user_id = p_user_id) then
      raise exception 'Bu müşteri işletmenizin müşteri listesinde değil';
    end if;
    if p_pet_id is not null and not exists (select 1 from pets where id = p_pet_id and owner_id = p_user_id) then
      raise exception 'Seçilen evcil hayvan bu müşteriye ait değil';
    end if;
    v_guest_name := null; v_guest_phone := null;
  else
    if v_guest_name is null or v_guest_phone is null then
      raise exception 'Müşteri adı ve telefonu gerekli';
    end if;
    v_unclaimed := insert_unclaimed_patient(v_guest_name, v_guest_phone,
      nullif(trim(coalesce(p_guest_pet_name, '')), ''), nullif(trim(coalesce(p_guest_pet_species, '')), ''), null, null);
  end if;

  if p_doctor_id is not null and not exists (select 1 from doctors where id = p_doctor_id and clinic_id = v_clinic) then
    raise exception 'Seçilen personel işletmenize ait değil';
  end if;

  select * into v_slot from find_slot_doctor(v_clinic, p_start, v_minutes, p_doctor_id, null, p_ignore_hours);
  if not v_slot.ok then
    raise exception 'Bu saat uygun değil (kapalı saat, izin ya da başka bir randevuyla çakışıyor)' using errcode = '23P01';
  end if;

  select name into v_pet_name from pets where id = p_pet_id;

  perform set_config('moffi.trusted_appointment_insert', 'on', true);
  insert into appointments (user_id, pet_id, clinic_id, clinic_name, doctor_id, doctor_name, appointment_date,
                            duration_minutes, reason, status, created_by, unclaimed_patient_id,
                            guest_name, guest_phone, guest_pet_name)
  values (p_user_id, p_pet_id, v_clinic, business_display_name(v_clinic), v_slot.doctor_id,
          (select name from doctors where id = v_slot.doctor_id), p_start, v_minutes,
          'Randevu tipi: ' || coalesce(nullif(trim(p_service_name), ''), 'Randevu')
            || coalesce(E'\n' || nullif(trim(coalesce(p_notes, '')), ''), ''),
          'confirmed', 'business', v_unclaimed, v_guest_name, v_guest_phone,
          coalesce(v_pet_name, nullif(trim(coalesce(p_guest_pet_name, '')), '')))
  returning id into v_id;
  perform set_config('moffi.trusted_appointment_insert', '', true);

  if p_user_id is not null then
    perform notify_user(p_user_id, 'appointment', 'Senin için randevu oluşturuldu',
      business_display_name(v_clinic) || ' · ' || to_char(p_start at time zone 'UTC', 'DD.MM.YYYY HH24:MI'), null, v_id::text);
  end if;
  return v_id;
end;
$$;

create or replace function public.get_clinic_clients()
returns table(client_key text, kind text, owner_id uuid, owner_name text, phone text, pet_id uuid, pet_name text, species text, breed text,
              avatar_url text, last_visit timestamptz, next_visit timestamptz, visit_count integer, no_show_count integer, note text)
language sql stable security definer set search_path to 'public' as $$
  with me as (select current_business_id() as id),
  moffi as (
    select 'user:' || a.user_id::text || ':' || coalesce(a.pet_id::text, '-') as client_key, a.user_id, a.pet_id,
           max(a.appointment_date) filter (where a.status = 'completed' or (a.status = 'confirmed' and a.appointment_date < wall_now())) as last_visit,
           min(a.appointment_date) filter (where a.status in ('pending', 'confirmed') and a.appointment_date >= wall_now()) as next_visit,
           count(*) filter (where a.status = 'completed')::int as visit_count,
           count(*) filter (where a.attendance_status = 'no_show')::int as no_show_count
      from appointments a, me where a.clinic_id = me.id and a.user_id is not null
     group by a.user_id, a.pet_id
  ),
  guests as (
    select 'guest:' || up.id::text as client_key, up.id as unclaimed_id,
           max(a.appointment_date) filter (where a.status = 'completed' or (a.status = 'confirmed' and a.appointment_date < wall_now())) as last_visit,
           min(a.appointment_date) filter (where a.status in ('pending', 'confirmed') and a.appointment_date >= wall_now()) as next_visit,
           count(a.id) filter (where a.status = 'completed')::int as visit_count,
           count(a.id) filter (where a.attendance_status = 'no_show')::int as no_show_count
      from unclaimed_patients up
      cross join me
      left join appointments a on a.unclaimed_patient_id = up.id and a.user_id is null
     where up.clinic_id = me.id::text and up.status <> 'claimed'
     group by up.id
  )
  select m.client_key, 'moffi', m.user_id, coalesce(pr.full_name, pr.username), pr.phone, m.pet_id, pe.name, pe.type, pe.breed,
         coalesce(pe.avatar_url, pr.avatar_url), m.last_visit, m.next_visit, m.visit_count, m.no_show_count, n.note
    from moffi m
    join profiles pr on pr.id = m.user_id
    left join pets pe on pe.id = m.pet_id
    left join clinic_client_notes n on n.clinic_id = (select id from me) and n.client_key = m.client_key
  union all
  select g.client_key, 'guest', null, up.raw_name, up.raw_phone, null, up.pet_name, up.pet_species, up.pet_breed, null,
         g.last_visit, g.next_visit, g.visit_count, g.no_show_count, n.note
    from guests g
    join unclaimed_patients up on up.id = g.unclaimed_id
    left join clinic_client_notes n on n.clinic_id = (select id from me) and n.client_key = g.client_key;
$$;

create or replace function public.record_consultation(p_appointment_id uuid, p_diagnosis text, p_critical_notes text default null,
    p_weight_kg numeric default null, p_temperature_c numeric default null, p_vaccines jsonb default '[]'::jsonb, p_medications jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
    a record;
    v_species text;
    v_vet text;
    v_record uuid;
    v_today date := (wall_now())::date;
    v jsonb; m jsonb; d record;
    v_date date; v_next date; v_days int; v_name text;
    v_snapshot jsonb := '[]'::jsonb;
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    select * into a from appointments where id = p_appointment_id for update;
    if not found then raise exception 'Randevu bulunamadı'; end if;
    if not can_handle_appointment(a.clinic_id, a.doctor_id) then raise exception 'Bu randevu size ait değil'; end if;
    if a.status not in ('pending','confirmed') then raise exception 'Bu randevu tamamlanamaz (durum: %)', a.status; end if;
    if a.pet_id is null then raise exception 'Bu randevuda Moffi''ye kayıtlı bir evcil hayvan yok; muayene kaydı hesap eşleşince girilebilir'; end if;
    if coalesce(btrim(p_diagnosis), '') = '' then raise exception 'Tanı zorunlu'; end if;
    if exists (select 1 from medical_records where appointment_id = p_appointment_id) then
        raise exception 'Bu randevu için muayene kaydı zaten var';
    end if;
    if p_weight_kg is not null and (p_weight_kg <= 0 or p_weight_kg >= 200) then raise exception 'Kilo geçersiz'; end if;
    if p_temperature_c is not null and (p_temperature_c < 30 or p_temperature_c > 45) then raise exception 'Vücut sıcaklığı geçersiz'; end if;

    select type into v_species from pets where id = a.pet_id;
    v_vet := coalesce(nullif(a.doctor_name, ''), business_display_name(a.clinic_id));

    insert into medical_records (pet_id, appointment_id, clinic_id, vet_name, diagnosis, critical_notes,
                                 weight_kg, temperature_c, medications)
    values (a.pet_id, a.id, a.clinic_id::text, v_vet, btrim(p_diagnosis), nullif(btrim(coalesce(p_critical_notes, '')), ''),
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
                v_vet, 'clinic', a.clinic_id, nullif(btrim(coalesce(v->>'batch', '')), ''));
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
                true, v_vet, 'clinic', a.clinic_id, v_record);
    end loop;

    perform transition_appointment(p_appointment_id, 'completed', null);
    return v_record;
end $$;

create or replace function public.enqueue_appointment_reminders()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_count integer := 0; r record; v_when text; v_key text; v_title text; v_now timestamptz := wall_now();
begin
  for r in
    select a.*,
           coalesce(p.reminder_prefs, '{}'::jsonb) as prefs,
           case
             when a.appointment_date between v_now + interval '23 hours' and v_now + interval '25 hours' then '24'
             when a.appointment_date between v_now + interval '90 minutes' and v_now + interval '150 minutes' then '2'
             when (a.appointment_date at time zone 'UTC')::date = (v_now at time zone 'UTC')::date
                  and extract(hour from v_now at time zone 'UTC') >= 8
                  and a.appointment_date > v_now + interval '150 minutes' then 'day'
           end as stage
      from appointments a
      join profiles p on p.id = a.user_id
     where a.status = 'confirmed' and a.user_id is not null
       and a.appointment_date between v_now + interval '90 minutes' and v_now + interval '25 hours'
  loop
    continue when r.stage is null;
    continue when coalesce((r.prefs ->> case r.stage when '24' then 'h24' when '2' then 'h2' else 'day' end)::boolean, true) = false;
    v_key := 'rem' || r.stage || ':' || r.id::text || ':' || to_char(r.appointment_date, 'YYYYMMDDHH24MI');
    continue when exists (select 1 from email_outbox where dedupe_key = v_key);
    v_when := to_char(r.appointment_date at time zone 'UTC', 'DD.MM.YYYY HH24:MI');
    v_title := case r.stage when '24' then 'Yarın randevun var' when '2' then 'Randevuna 2 saat kaldı' else 'Bugün randevun var' end;
    insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
    values (r.user_id, 'appointment', v_title, business_display_name(r.clinic_id) || ' · ' || v_when, null, r.id::text, false);
    perform enqueue_email(r.user_id, 'Moffi · ' || v_title, v_title,
      business_display_name(r.clinic_id) || ' · ' || v_when
        || coalesce(' · ' || nullif(r.doctor_name, ''), '')
        || '. Gelemeyeceksen uygulamadan iptal edebilir ya da erteleme isteyebilirsin.',
      '/vet', v_key);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Misafir (Moffi dışı) müşteriler ve SMS: işletme = kişinin şu an adına çalıştığı işletme.
create or replace function public.insert_unclaimed_patient(p_raw_name text, p_raw_phone text, p_pet_name text, p_pet_species text, p_pet_breed text, p_legacy_notes text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
    v_id uuid;
    v_normalized text;
    v_existing_id uuid;
    v_biz uuid := current_business_id();
begin
    if v_biz is null then raise exception 'Bir işletmenin üyesi değilsin'; end if;
    v_normalized := regexp_replace(p_raw_phone, '[^0-9]', '', 'g');
    if left(v_normalized, 1) = '0' then v_normalized := '+9' || v_normalized;
    elsif left(v_normalized, 2) != '90' then v_normalized := '+90' || v_normalized;
    else v_normalized := '+' || v_normalized; end if;

    select id into v_existing_id from unclaimed_patients
     where clinic_id = v_biz::text and normalized_phone = v_normalized and status in ('unclaimed', 'sms_sent')
     limit 1;

    if v_existing_id is not null then
        update unclaimed_patients
           set raw_name = p_raw_name, pet_name = p_pet_name, pet_species = p_pet_species, pet_breed = p_pet_breed,
               legacy_notes = coalesce(p_legacy_notes, legacy_notes)
         where id = v_existing_id;
        return v_existing_id;
    end if;

    insert into unclaimed_patients (clinic_id, raw_name, raw_phone, normalized_phone, pet_name, pet_species, pet_breed, legacy_notes)
    values (v_biz::text, p_raw_name, p_raw_phone, v_normalized, p_pet_name, p_pet_species, p_pet_breed, p_legacy_notes)
    returning id into v_id;
    return v_id;
end;
$$;

create or replace function public.get_my_unclaimed_patients()
returns setof unclaimed_patients language sql stable security definer set search_path to 'public' as $$
    select * from unclaimed_patients where clinic_id = current_business_id()::text order by created_at desc;
$$;

create or replace function public.approve_manual_claim(p_unclaimed_id uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
    v_record record;
    v_new_pet_id uuid;
begin
    select * into v_record from unclaimed_patients
     where id = p_unclaimed_id and clinic_id = current_business_id()::text and claim_requested_by is not null;
    if not found then raise exception 'Yetkisiz veya kayıt bulunamadı.'; end if;

    insert into pets (owner_id, name, type, breed, health_notes)
    values (v_record.claim_requested_by, v_record.pet_name, v_record.pet_species, v_record.pet_breed, v_record.legacy_notes)
    returning id into v_new_pet_id;

    if v_record.legacy_notes is not null and trim(v_record.legacy_notes) != '' then
        insert into medical_records (pet_id, clinic_id, vet_name, diagnosis, critical_notes, created_at)
        values (v_new_pet_id, v_record.clinic_id, 'Geçmiş Kayıt (Veri Göçü)', v_record.legacy_notes,
                'Bu kayıt eski sistemden aktarılmıştır, tarih kesin değildir.', v_record.created_at);
    end if;

    update unclaimed_patients
       set status = 'claimed', claimed_by_user_id = v_record.claim_requested_by, claimed_pet_id = v_new_pet_id, claimed_at = now()
     where id = p_unclaimed_id;
    return v_new_pet_id;
end;
$$;

create or replace function public.get_my_sms_status()
returns table(provider text, sender_id text, is_active boolean) language sql stable security definer set search_path to 'public' as $$
    select s.provider, s.sender_id, s.is_active from clinic_sms_settings s
     where s.clinic_id = current_business_id()::text and can_manage_business(current_business_id());
$$;

create or replace function public.set_clinic_sms_settings(p_provider text, p_api_username text, p_api_key text, p_sender_id text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v_biz uuid := current_business_id();
begin
    if v_biz is null or not can_manage_business(v_biz) then raise exception 'Bu ayarı sadece işletme sahibi veya yöneticisi değiştirebilir'; end if;
    insert into clinic_sms_settings (clinic_id, provider, api_username, api_key, sender_id, is_active)
    values (v_biz::text, p_provider, p_api_username, p_api_key, p_sender_id, true)
    on conflict (clinic_id) do update
       set provider = p_provider, api_username = p_api_username, api_key = p_api_key, sender_id = p_sender_id, is_active = true;
    return true;
end;
$$;

-- Satıcı (mağaza) kontrolleri ve bildirimleri
create or replace function public.is_order_item_seller(p_business_id uuid, p_product_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select (p_business_id is not null and can_manage_business(p_business_id))
      or exists (select 1 from products p where p.id = p_product_id and can_manage_business(p.owner_id));
$$;

create or replace function public.is_order_seller(p_order_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from order_items oi
    left join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
      and ((oi.business_id is not null and can_manage_business(oi.business_id)) or (p.owner_id is not null and can_manage_business(p.owner_id)))
  );
$$;

create or replace function public.finalize_paid_order(p_order_id uuid, p_amount_kurus bigint)
returns text language plpgsql security definer set search_path to 'public' as $$
declare o orders; r record; v_seller uuid; v_count integer;
begin
  select * into o from orders where id = p_order_id for update;
  if not found then return 'not_found'; end if;
  if o.status in ('paid', 'confirmed') then return 'duplicate'; end if;
  if round(o.total_amount * 100)::bigint <> p_amount_kurus then
    raise exception 'Tutar uyuşmuyor: sipariş %, ödeme %', round(o.total_amount * 100), p_amount_kurus;
  end if;

  update orders set status = 'paid', updated_at = now() where id = o.id;
  update order_items set status = 'preparing' where order_id = o.id and status = 'awaiting_payment';

  for r in select product_id, sum(quantity)::int as qty from order_items where order_id = o.id group by product_id loop
    update products set stock = greatest(coalesce(stock, 0) - r.qty, 0) where id = r.product_id;
  end loop;

  delete from cart_items where user_id = o.user_id;

  select count(*) into v_count from order_items where order_id = o.id;
  perform notify_user(o.user_id, 'order', 'Siparişin alındı',
    v_count || ' ürün · ' || replace(to_char(o.total_amount, 'FM999999990.00'), '.', ',') || ' ₺. Satıcı hazırladığında haber vereceğiz.',
    null, o.id::text);

  for v_seller in
    select distinct coalesce(oi.business_id, p.owner_id)
      from order_items oi left join products p on p.id = oi.product_id
     where oi.order_id = o.id and coalesce(oi.business_id, p.owner_id) is not null
  loop
    perform notify_business(v_seller, null, 'biz_order', 'Yeni sipariş',
      (select string_agg(coalesce(p.name, 'Ürün') || ' × ' || oi.quantity, ', ')
         from order_items oi left join products p on p.id = oi.product_id
        where oi.order_id = o.id and coalesce(oi.business_id, p.owner_id) = v_seller)
      || '. Hazırlayıp kargoya verebilirsin.', o.user_id, o.id::text);
  end loop;
  return 'paid';
end;
$$;

create or replace function public.order_items_notify_status()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare r record; v_track text;
begin
  for r in
    select n.order_id, n.status, coalesce(n.business_id, p.owner_id) as seller, count(*) as cnt
      from new_rows n
      join old_rows o on o.id = n.id and o.status is distinct from n.status
      left join products p on p.id = n.product_id
     where n.status in ('shipped', 'delivered')
     group by n.order_id, n.status, coalesce(n.business_id, p.owner_id)
  loop
    select nullif(concat_ws(' · ', carrier, case when tracking_number is not null then 'Takip no ' || tracking_number end), '')
      into v_track from orders where id = r.order_id;
    perform notify_user((select user_id from orders where id = r.order_id), 'order',
      case r.status when 'shipped' then 'Siparişin kargoya verildi' else 'Siparişin teslim edildi' end,
      business_display_name(r.seller) || ' · ' || r.cnt || ' ürün' || coalesce('. ' || case when r.status = 'shipped' then v_track end, ''),
      null, r.order_id::text);
  end loop;
  return null;
end;
$$;

-- Barınak iş ortağı: kişi onaylı bir barınağın sahibi ya da yöneticisi mi.
create or replace function public.is_approved_shelter(p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from business_members m join businesses b on b.id = m.business_id
                    where m.user_id = p_user and m.role in ('owner', 'manager') and b.business_type = 'shelter' and b.approved);
$$;

-- Paylaşılan pasaportta klinik adı işletme kaydından.
do $$ declare d text; d2 text; begin
    d := pg_get_functiondef('public.get_shared_passport'::regproc);
    d2 := replace(replace(d,
        'coalesce(pr.business_name, pr.full_name, mr.external_clinic_name)', 'coalesce(bz.name::text, mr.external_clinic_name)'),
        'left join profiles pr on pr.id::text = mr.clinic_id', 'left join businesses bz on bz.id::text = mr.clinic_id');
    if d2 = d or d2 ~ '\mpr\.' then raise exception 'get_shared_passport beklenen biçimde değil'; end if;
    execute d2;
end $$;

-- 8) notify_user: işletme bildirimi türleri e-postaya düşer (kişisel bildirimlerle aynı yol).
-- (notify_business kendi e-postasını kuyruğa yazar; buradaki liste kişisel türler içindir.)
