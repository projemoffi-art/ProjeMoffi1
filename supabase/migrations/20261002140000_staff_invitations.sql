-- ============================================================================
-- Faz 1c: Personel daveti
-- Sahip/yönetici e-postayla kişi davet eder; kişi /invitation/{token} sayfasında kabul/ret eder.
-- Tüm yazmalar sunucu fonksiyonlarında; istemci davet tablosuna yazamaz, gizli anahtarı okuyamaz.
-- ============================================================================

-- Not: bu dosyada bilerek DROP yok (Supabase bağlayıcısı silme sayılan ifadeleri onaysız çalıştırmıyor).

-- 0) E-posta kuyruğu: hesabı olmayan kişiye (sadece e-posta adresi) gönderim
alter table public.email_outbox add column if not exists recipient_email text;
alter table public.email_outbox alter column user_id drop not null;
do $$ begin
    if not exists (select 1 from pg_constraint where conname = 'email_outbox_recipient_check') then
        alter table public.email_outbox add constraint email_outbox_recipient_check
            check (user_id is not null or recipient_email is not null);
    end if;
end $$;

-- Hesaba bağlı e-postalar enqueue_email (değişmedi); hesabı olmayan adresler bu fonksiyonla.
create or replace function public.enqueue_email_address(
    p_email text, p_subject text, p_heading text, p_body text, p_cta_url text default null
) returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if p_email is null then return; end if;
    insert into email_outbox (user_id, recipient_email, subject, heading, body, cta_url)
    values (null, p_email, p_subject, p_heading, p_body, p_cta_url);
end;
$$;

revoke all on function public.enqueue_email_address(text, text, text, text, text) from public, anon, authenticated;

-- 1) Davetler
create table if not exists public.business_invitations (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    email text not null,
    role text not null check (role in ('manager', 'staff')),
    doctor_id uuid references public.doctors(id) on delete set null,
    invited_by uuid not null references auth.users(id) on delete cascade,
    token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
    accepted_by uuid references auth.users(id) on delete set null,
    expires_at timestamptz not null default now() + interval '7 days',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists business_invitations_business_idx on public.business_invitations (business_id, created_at desc);
create unique index if not exists business_invitations_unique_pending
    on public.business_invitations (business_id, lower(email)) where status = 'pending';

alter table public.business_invitations enable row level security;

do $$ begin
    if not exists (select 1 from pg_policies where tablename = 'business_invitations'
                    and policyname = 'Managers read own business invitations') then
        create policy "Managers read own business invitations"
            on public.business_invitations for select to authenticated
            using (can_manage_business(business_id));
    end if;
end $$;

-- token kolonu bilerek verilmiyor (sadece davet edilen kişinin e-postasındaki bağlantıda).
-- Bu projede public şemasında varsayılan yetki yok (8.10), yeni tabloya otomatik yetki gelmez.
grant select (id, business_id, email, role, doctor_id, invited_by, status, accepted_by, expires_at, created_at, updated_at)
    on public.business_invitations to authenticated;

-- Bir personel kaydı (takvim sütunu) en fazla bir hesaba bağlanır
create unique index if not exists business_members_one_account_per_doctor
    on public.business_members (doctor_id) where doctor_id is not null;

-- 2) notify_user: davet bildirimi e-postayla da gider
create or replace function public.notify_user(
    p_user_id uuid, p_type text, p_title text, p_content text,
    p_actor_id uuid, p_entity_id text
) returns void language plpgsql security definer set search_path to 'public' as $$
declare v_is_business boolean;
begin
  if p_user_id is null or p_user_id = p_actor_id then return; end if;
  insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
  values (p_user_id, p_type, p_title, p_content, p_actor_id, p_entity_id, false);
  if p_type in ('appointment', 'order', 'health', 'sos', 'lost_sighting', 'adoption_application', 'adoption_update', 'pet_transfer', 'staff_invitation') then
    select role = 'business' into v_is_business from profiles where id = p_user_id;
    perform enqueue_email(p_user_id, 'Moffi · ' || p_title, p_title, p_content,
      case
        when p_type = 'health' then '/health'
        when p_type = 'sos' then '/pasaport'
        when p_type = 'lost_sighting' then '/kayip/' || p_entity_id || '/yonet'
        when p_type = 'adoption_application' then '/sahiplendirme/basvuru/' || p_entity_id
        when p_type in ('adoption_update', 'pet_transfer') then '/sahiplendirme/basvurularim'
        when p_type = 'staff_invitation' then '/invitation/' || p_entity_id
        when p_type = 'appointment' and coalesce(v_is_business, false) then '/business/calendar'
        when p_type = 'appointment' then '/vet'
        when coalesce(v_is_business, false) then '/business/orders'
        else '/petshop'
      end);
  end if;
end;
$$;

-- 3) Davet gönder (sahip/yönetici)
create or replace function public.invite_staff(
    p_business_id uuid,
    p_email text,
    p_role text,
    p_doctor_id uuid default null
) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
    v_caller uuid := auth.uid();
    v_biz_name text;
    v_email text := lower(trim(coalesce(p_email, '')));
    v_target uuid;
    v_id uuid;
    v_token text;
    v_title text;
    v_body text;
begin
    if v_caller is null then raise exception 'Giriş gerekli'; end if;
    if not can_manage_business(p_business_id) then raise exception 'Bu işlem için yetkin yok'; end if;
    if p_role not in ('manager', 'staff') then raise exception 'Geçersiz rol'; end if;
    if length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'Geçerli bir e-posta adresi gir';
    end if;

    select name into v_biz_name from businesses where id = p_business_id;
    if v_biz_name is null then raise exception 'İşletme bulunamadı'; end if;

    -- Süresi dolan bekleyen davetler kapanır (aynı adrese yeniden davet atılabilsin)
    update business_invitations set status = 'expired', updated_at = now()
     where business_id = p_business_id and status = 'pending' and expires_at < now();

    if (select count(*) from business_invitations
         where business_id = p_business_id and created_at > now() - interval '1 day') >= 30 then
        raise exception 'Bugün için davet sınırına ulaştın, yarın tekrar dene';
    end if;

    if p_doctor_id is not null then
        if not exists (select 1 from doctors where id = p_doctor_id and clinic_id = p_business_id) then
            raise exception 'Bu personel kaydı bu işletmeye ait değil';
        end if;
        if exists (select 1 from business_members where doctor_id = p_doctor_id) then
            raise exception 'Bu personel kaydı zaten bir hesaba bağlı';
        end if;
        if exists (select 1 from business_invitations
                    where doctor_id = p_doctor_id and status = 'pending') then
            raise exception 'Bu personel kaydı için bekleyen bir davet var';
        end if;
    end if;

    select id into v_target from auth.users where lower(email) = v_email;
    if v_target = v_caller then raise exception 'Kendini davet edemezsin'; end if;
    if v_target is not null and exists (
        select 1 from business_members where business_id = p_business_id and user_id = v_target) then
        raise exception 'Bu kişi zaten ekibinde';
    end if;
    if exists (select 1 from business_invitations
                where business_id = p_business_id and lower(email) = v_email and status = 'pending') then
        raise exception 'Bu adrese bekleyen bir davet zaten var';
    end if;

    insert into business_invitations (business_id, email, role, doctor_id, invited_by)
    values (p_business_id, v_email, p_role, p_doctor_id, v_caller)
    returning id, token into v_id, v_token;

    v_title := v_biz_name || ' seni ekibine davet ediyor';
    v_body := v_biz_name || ' seni Moffi''de ' ||
        case p_role when 'manager' then 'yönetici' else 'personel' end ||
        ' olarak ekibine davet ediyor. Davet 7 gün geçerli.';

    if v_target is not null then
        perform notify_user(v_target, 'staff_invitation', v_title, v_body, v_caller, v_token);
    else
        perform enqueue_email_address(v_email, 'Moffi · ' || v_title, v_title,
            v_body || ' Kabul etmek için bu e-posta adresiyle Moffi''ye kaydol veya giriş yap.',
            '/invitation/' || v_token);
    end if;

    return jsonb_build_object('id', v_id);
end;
$$;

-- 4) Daveti görüntüle (kabul sayfası)
create or replace function public.get_invitation_by_token(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
    v_email text;
    v_inv record;
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    select lower(email) into v_email from auth.users where id = auth.uid();

    select bi.id, bi.business_id, bi.email, bi.role, bi.status, bi.expires_at, bi.created_at,
           b.name as business_name, b.business_type, b.logo_url,
           p.full_name as inviter_name, d.name as doctor_name
      into v_inv
      from business_invitations bi
      join businesses b on b.id = bi.business_id
      left join profiles p on p.id = bi.invited_by
      left join doctors d on d.id = bi.doctor_id
     where bi.token = p_token;

    if v_inv.id is null then return jsonb_build_object('error', 'not_found'); end if;

    if v_email is distinct from lower(v_inv.email) then
        -- Davetli adresin sadece maskeli hali (hangi hesapla girmesi gerektiğini anlasın)
        return jsonb_build_object('error', 'wrong_email',
            'expected_email', left(v_inv.email, 2) || '***' || substr(v_inv.email, position('@' in v_inv.email)));
    end if;

    if v_inv.status = 'pending' and v_inv.expires_at < now() then
        update business_invitations set status = 'expired', updated_at = now() where id = v_inv.id;
        v_inv.status := 'expired';
    end if;

    return jsonb_build_object(
        'id', v_inv.id,
        'business_id', v_inv.business_id,
        'business_name', v_inv.business_name,
        'business_type', v_inv.business_type,
        'logo_url', v_inv.logo_url,
        'role', v_inv.role,
        'status', v_inv.status,
        'expires_at', v_inv.expires_at,
        'doctor_name', v_inv.doctor_name,
        'inviter_name', v_inv.inviter_name,
        'already_member', exists (select 1 from business_members
                                   where business_id = v_inv.business_id and user_id = auth.uid())
    );
end;
$$;

-- 5) Kabul / ret (davet edilen kişi)
create or replace function public.respond_staff_invitation(p_token text, p_accept boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
    v_caller uuid := auth.uid();
    v_email text;
    v_name text;
    v_inv business_invitations%rowtype;
    v_doctor uuid;
    v_role_label text;
begin
    if v_caller is null then raise exception 'Giriş gerekli'; end if;
    select lower(email) into v_email from auth.users where id = v_caller;

    select * into v_inv from business_invitations where token = p_token for update;
    if v_inv.id is null then raise exception 'Davet bulunamadı'; end if;
    if v_email is distinct from lower(v_inv.email) then
        raise exception 'Bu davet başka bir e-posta adresine gönderilmiş';
    end if;
    if v_inv.status = 'pending' and v_inv.expires_at < now() then
        update business_invitations set status = 'expired', updated_at = now() where id = v_inv.id;
        raise exception 'Bu davetin süresi dolmuş';
    end if;
    if v_inv.status <> 'pending' then
        raise exception 'Bu davet artık geçerli değil';
    end if;

    select coalesce(nullif(trim(full_name), ''), v_inv.email) into v_name from profiles where id = v_caller;
    v_name := coalesce(v_name, v_inv.email);
    v_role_label := case v_inv.role when 'manager' then 'yönetici' else 'personel' end;

    if not p_accept then
        update business_invitations set status = 'declined', updated_at = now() where id = v_inv.id;
        perform notify_business(v_inv.business_id, null, 'biz_staff',
            v_name || ' daveti reddetti', v_name || ' ekibe katılma davetini kabul etmedi.',
            v_caller, v_inv.business_id::text);
        return jsonb_build_object('status', 'declined');
    end if;

    if exists (select 1 from business_members where business_id = v_inv.business_id and user_id = v_caller) then
        update business_invitations set status = 'accepted', accepted_by = v_caller, updated_at = now() where id = v_inv.id;
        return jsonb_build_object('status', 'already_member', 'business_id', v_inv.business_id);
    end if;

    -- Personel kaydı bu arada başka hesaba bağlandıysa ya da silindiyse bağsız katılır
    v_doctor := v_inv.doctor_id;
    if v_doctor is not null and (
        exists (select 1 from business_members where doctor_id = v_doctor)
        or not exists (select 1 from doctors where id = v_doctor and clinic_id = v_inv.business_id)) then
        v_doctor := null;
    end if;

    insert into business_members (business_id, user_id, role, doctor_id)
    values (v_inv.business_id, v_caller, v_inv.role, v_doctor);

    update business_invitations set status = 'accepted', accepted_by = v_caller, updated_at = now() where id = v_inv.id;
    update profiles set active_business_id = v_inv.business_id where id = v_caller;

    perform notify_business(v_inv.business_id, null, 'biz_staff',
        v_name || ' ekibe katıldı', v_name || ' davetini kabul etti ve ' || v_role_label || ' olarak ekibe katıldı.',
        v_caller, v_inv.business_id::text);

    return jsonb_build_object('status', 'accepted', 'business_id', v_inv.business_id);
end;
$$;

-- 6) Daveti iptal et (sahip/yönetici)
create or replace function public.cancel_staff_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_inv business_invitations%rowtype;
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    select * into v_inv from business_invitations where id = p_invitation_id for update;
    if v_inv.id is null or not can_manage_business(v_inv.business_id) then
        raise exception 'Davet bulunamadı';
    end if;
    if v_inv.status <> 'pending' then raise exception 'Sadece bekleyen davetler iptal edilebilir'; end if;
    update business_invitations set status = 'cancelled', updated_at = now() where id = p_invitation_id;
end;
$$;

-- 7) Ekipten çıkar (sahip: herkesi; yönetici: sadece personeli)
create or replace function public.remove_business_member(p_business_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
    v_caller uuid := auth.uid();
    v_caller_role text;
    v_target_role text;
    v_biz_name text;
begin
    if v_caller is null then raise exception 'Giriş gerekli'; end if;
    if v_caller = p_user_id then raise exception 'Kendini ekipten çıkaramazsın'; end if;

    v_caller_role := business_member_role(p_business_id);
    if v_caller_role is null or v_caller_role not in ('owner', 'manager') then
        raise exception 'Bu işlem için yetkin yok';
    end if;

    select role into v_target_role from business_members
     where business_id = p_business_id and user_id = p_user_id for update;
    if v_target_role is null then raise exception 'Bu kişi ekibinde değil'; end if;
    if v_target_role = 'owner' then raise exception 'İşletme sahibi çıkarılamaz'; end if;
    if v_target_role = 'manager' and v_caller_role <> 'owner' then
        raise exception 'Yöneticiyi sadece işletme sahibi çıkarabilir';
    end if;

    select name into v_biz_name from businesses where id = p_business_id;

    delete from business_members where business_id = p_business_id and user_id = p_user_id;
    update profiles set active_business_id = null
     where id = p_user_id and active_business_id = p_business_id;

    perform notify_user(p_user_id, 'staff_removed',
        v_biz_name || ' ekibinden çıkarıldın',
        v_biz_name || ' işletmesindeki üyeliğin sonlandırıldı.',
        v_caller, p_business_id::text);
end;
$$;

-- 8) Ekip listesi (işletme üyeleri görür; e-postayı sadece sahip/yönetici görür)
create or replace function public.get_business_team(p_business_id uuid)
returns table (user_id uuid, role text, doctor_id uuid, doctor_name text, created_at timestamptz,
               full_name text, avatar_url text, email text)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_manage boolean;
begin
    if not is_business_member(p_business_id) then raise exception 'Bu işletmenin üyesi değilsin'; end if;
    v_manage := can_manage_business(p_business_id);
    return query
        select m.user_id, m.role, m.doctor_id, d.name, m.created_at,
               p.full_name::text, p.avatar_url::text,
               case when v_manage then u.email::text end
          from business_members m
          left join doctors d on d.id = m.doctor_id
          left join profiles p on p.id = m.user_id
          left join auth.users u on u.id = m.user_id
         where m.business_id = p_business_id
         order by (m.role = 'owner') desc, (m.role = 'manager') desc, m.created_at;
end;
$$;

-- 9) Yetkiler
do $$ declare f text; begin
    foreach f in array array[
        'invite_staff(uuid, text, text, uuid)',
        'respond_staff_invitation(text, boolean)',
        'cancel_staff_invitation(uuid)',
        'remove_business_member(uuid, uuid)',
        'get_invitation_by_token(text)',
        'get_business_team(uuid)'
    ] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;
