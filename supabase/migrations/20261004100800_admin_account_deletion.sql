-- Yönetici kullanıcı listesindeki "Sil" (2026-10-03 genel kontrol): istemciden profiles satırını doğrudan siliyordu — hesap (auth) kalıyor,
-- profil kayboluyor, 30 günlük geri alınabilir silme süreci (8.57) atlanıyordu. Artık yönetici hesabı aynı sürece alır.
-- Profil satırını doğrudan silme izni ayrıca kaldırılır: 20261004100900_profiles_no_direct_delete_MANUAL_sql_editor.sql.

create or replace function public.admin_schedule_account_deletion(p_user uuid)
returns timestamptz
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_when timestamptz := now() + interval '30 days';
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then raise exception 'Bu işlem için iki adımlı doğrulama gerekli'; end if;
    if p_user = auth.uid() then raise exception 'Kendi hesabını buradan silemezsin'; end if;
    if exists (select 1 from profiles where id = p_user and role = 'admin') then raise exception 'Yönetici hesabı silinemez'; end if;
    if not exists (select 1 from profiles where id = p_user) then raise exception 'Kullanıcı bulunamadı'; end if;
    if exists (
        select 1 from business_members m
         where m.user_id = p_user and m.role = 'owner'
           and exists (select 1 from business_members o where o.business_id = m.business_id and o.user_id <> p_user)) then
        raise exception 'Kullanıcı ekibi olan bir işletmenin sahibi; önce işletmenin sahipliği devredilmeli';
    end if;

    update profiles set deletion_requested_at = now(), deletion_scheduled_for = v_when where id = p_user;

    perform enqueue_email(p_user, 'Moffi · Hesabın kapatma sürecinde', 'Hesabın 30 gün sonra silinecek',
        'Moffi ekibi hesabını kapatma sürecine aldı. Hesabın ' || to_char(v_when at time zone 'Europe/Istanbul', 'DD.MM.YYYY') ||
        ' tarihinde kalıcı olarak silinecek. Bunun bir hata olduğunu düşünüyorsan bu e-postayı yanıtlayarak bize ulaş.',
        '/home');
    return v_when;
end;
$$;

create or replace function public.admin_cancel_account_deletion(p_user uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then raise exception 'Bu işlem için iki adımlı doğrulama gerekli'; end if;
    update profiles set deletion_requested_at = null, deletion_scheduled_for = null where id = p_user;
end;
$$;

revoke execute on function public.admin_schedule_account_deletion(uuid) from public, anon;
grant execute on function public.admin_schedule_account_deletion(uuid) to authenticated;
revoke execute on function public.admin_cancel_account_deletion(uuid) from public, anon;
grant execute on function public.admin_cancel_account_deletion(uuid) to authenticated;
