-- profiles'ta e-posta sütunu yok (e-posta yalnızca auth.users'ta). Yönetici ekranları (Kullanıcılar, İşletme Yönetimi) e-postayı buradan okur.
-- Yalnızca yönetici + iki adımlı doğrulama; en fazla 1000 kimlik.

create or replace function public.admin_user_emails(p_ids uuid[])
returns table (id uuid, email text, last_sign_in_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if not is_platform_admin() then raise exception 'Yalnızca yönetici'; end if;
    if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then raise exception 'Bu işlem için iki adımlı doğrulama gerekli'; end if;
    if coalesce(array_length(p_ids, 1), 0) > 1000 then raise exception 'En fazla 1000 kullanıcı'; end if;
    return query select u.id, u.email::text, u.last_sign_in_at from auth.users u where u.id = any (p_ids);
end;
$$;

revoke execute on function public.admin_user_emails(uuid[]) from public, anon;
grant execute on function public.admin_user_emails(uuid[]) to authenticated;
