-- Faz 1d: davet e-posta eşleşmesine dayanıyor; doğrulanmamış hesap (başkasının adresiyle açılmış olabilir) kabul edemez.
create or replace function public.respond_staff_invitation(p_token text, p_accept boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
    v_caller uuid := auth.uid();
    v_email text;
    v_confirmed boolean;
    v_name text;
    v_inv business_invitations%rowtype;
    v_doctor uuid;
    v_role_label text;
begin
    if v_caller is null then raise exception 'Giriş gerekli'; end if;
    select lower(email), email_confirmed_at is not null into v_email, v_confirmed from auth.users where id = v_caller;

    select * into v_inv from business_invitations where token = p_token for update;
    if v_inv.id is null then raise exception 'Davet bulunamadı'; end if;
    if v_email is distinct from lower(v_inv.email) then
        raise exception 'Bu davet başka bir e-posta adresine gönderilmiş';
    end if;
    if not coalesce(v_confirmed, false) then
        raise exception 'Daveti yanıtlamadan önce e-posta adresini doğrulaman gerekiyor';
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
