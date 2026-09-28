-- Duyurular, günün yıldızları ve veteriner tavsiyelerinin okuma kuralları vardı ama tabloya yetki (GRANT)
-- verilmemişti (CLAUDE.md 5.7 tuzağı): üçü de uygulamada hiç çalışmıyor, sessizce örnek veriye düşüyordu.
-- Ayrıca veteriner tavsiyesinde herhangi bir işletme başka kliniğin tavsiyesini değiştirebiliyordu.

grant select on public.system_announcements, public.daily_stars, public.vet_advices to anon, authenticated;
grant insert, update, delete on public.system_announcements, public.daily_stars, public.vet_advices to authenticated;

drop policy if exists "Allow write access to vet_advices for admins and businesses" on public.vet_advices;
drop policy if exists "Vet advices: admin or own clinic writes" on public.vet_advices;
create policy "Vet advices: admin or own clinic writes" on public.vet_advices for all to authenticated
    using (public.get_my_role() = 'admin' or (public.get_my_role() = 'business' and clinic_id = auth.uid()::text))
    with check (public.get_my_role() = 'admin' or (public.get_my_role() = 'business' and clinic_id = auth.uid()::text));
