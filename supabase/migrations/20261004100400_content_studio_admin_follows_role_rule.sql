-- İçerik Stüdyosu yönetici denetimi get_my_role() üzerinden: yönetici iki adımlı doğrulama kuralı (20261002180000)
-- uygulandığında aal1 oturumdaki yönetici burada da sıradan kullanıcı sayılır.
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
    select coalesce(get_my_role(), 'user') = 'admin';
$$;
