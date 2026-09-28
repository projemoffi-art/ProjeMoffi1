-- Acil güvenlik düzeltmesi (sosyal/kayıp/sahiplendirme denetimi sırasında bulundu, 2026-09-28):
--   * posts: "Admin paneli gonderileri silebilir" kuralı herkes için using(true) idi → giriş yapan
--     herkes herkesin gönderisini silebiliyordu. Artık sadece yönetici.
--   * posts / stories: with check (true) ekleme kuralları → başkası adına gönderi/hikâye eklenebiliyordu.
--   * reports / adoption_reports: şikâyetleri (şikâyet edenin kimliği dahil) herkes okuyabiliyordu; başkası
--     adına şikâyet eklenebiliyordu. Artık yönetici okur; şikâyet kendi adına ya da isimsiz eklenir.
--   * anon rolünden gereksiz yazma yetkileri kaldırıldı (satır kuralları zaten engelliyordu; savunma katmanı).

drop policy if exists "Admin paneli gonderileri silebilir" on public.posts;
drop policy if exists "Allow All Authenticated Inserts" on public.posts;
drop policy if exists "Posts: admin deletes" on public.posts;
create policy "Posts: admin deletes" on public.posts for delete to authenticated
    using (public.get_my_role() = 'admin');

drop policy if exists "Allow All Authenticated Stories" on public.stories;

drop policy if exists "Admin paneli şikayetleri okuyabilir" on public.reports;
drop policy if exists "Allow anon to insert reports" on public.reports;
drop policy if exists "Herkes şikayet gönderebilir" on public.reports;
drop policy if exists "Reports: admin reads" on public.reports;
drop policy if exists "Reports: anonymous or own insert" on public.reports;
create policy "Reports: admin reads" on public.reports for select to authenticated
    using (public.get_my_role() = 'admin');
create policy "Reports: anonymous or own insert" on public.reports for insert to anon, authenticated
    with check (reporter_id is null or reporter_id = auth.uid());

drop policy if exists "Admin paneli ilan şikayetlerini okuyabilir" on public.adoption_reports;
drop policy if exists "Herkes ilan şikayeti gönderebilir" on public.adoption_reports;

revoke insert, update, delete, truncate, references, trigger on
    public.lost_pets, public.adoption_pets, public.pet_sightings, public.comments, public.likes,
    public.adoption_reports, public.profiles
    from anon;
revoke update, delete, truncate, references, trigger on public.reports from anon;
revoke truncate, references, trigger on
    public.lost_pets, public.adoption_pets, public.pet_sightings, public.comments, public.likes,
    public.reports, public.adoption_reports, public.profiles, public.posts, public.stories, public.follows
    from authenticated;
