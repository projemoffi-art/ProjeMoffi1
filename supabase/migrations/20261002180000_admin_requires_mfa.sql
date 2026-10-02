-- Faz 1e: yönetici yetkisi sadece iki adımlı doğrulamayla (aal2) açılmış oturumda geçerli.
-- ÖNCE yönetici /admin'den doğrulama uygulamasını kurmuş olmalı; yoksa yönetici verisine erişim kapanır
-- (panel yine açılır, kurulum ekranı gösterir).

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path to 'public' as $$
    select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
       and exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 15 kural ve moderate_adoption_listing bu fonksiyonu kullanıyor: aal1'deki yönetici sıradan kullanıcı sayılır
create or replace function public.get_my_role() returns text
language sql stable security definer set search_path to 'public' as $$
    select case
             when role = 'admin' and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then 'user'
             else coalesce(role, 'user')
           end
      from profiles where id = auth.uid() limit 1;
$$;

-- Rolü doğrudan profiles'tan okuyan 9 yönetici kuralı → is_admin()
do $$
declare p record;
begin
    for p in
        select tablename, policyname, qual, with_check from pg_policies
         where schemaname = 'public'
           and (coalesce(qual, '') || coalesce(with_check, '')) like '%''admin''%'
           and (coalesce(qual, '') || coalesce(with_check, '')) not like '%get_my_role%'
           and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_admin%'
    loop
        if p.qual is not null then
            execute format('alter policy %I on public.%I using (public.is_admin())', p.policyname, p.tablename);
        end if;
        if p.with_check is not null then
            execute format('alter policy %I on public.%I with check (public.is_admin())', p.policyname, p.tablename);
        end if;
    end loop;
end $$;
