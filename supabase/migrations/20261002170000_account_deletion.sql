-- Faz 1e: hesap silme — talep, 30 gün bekleme, geri alma, zamanı gelince kalıcı silme.
-- Kalıcı silme /api/cron/account-purge'da (servis rolü: depolama dosyaları + Supabase Auth hesabı).

alter table public.profiles add column if not exists deletion_requested_at timestamptz;
alter table public.profiles add column if not exists deletion_scheduled_for timestamptz;
create index if not exists profiles_deletion_due_idx on public.profiles (deletion_scheduled_for) where deletion_scheduled_for is not null;

-- İstemci bu alanları profil güncellemesiyle değiştiremez; sadece aşağıdaki fonksiyonlar
create or replace function public.guard_profile_deletion() returns trigger language plpgsql as $$
begin
    if current_user in ('authenticated', 'anon') then
        new.deletion_requested_at := old.deletion_requested_at;
        new.deletion_scheduled_for := old.deletion_scheduled_for;
    end if;
    return new;
end;
$$;

do $$ begin
    if not exists (select 1 from pg_trigger where tgname = 'profiles_guard_deletion') then
        create trigger profiles_guard_deletion before update on public.profiles
            for each row execute function public.guard_profile_deletion();
    end if;
end $$;

create or replace function public.request_account_deletion()
returns timestamptz language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid();
    v_when timestamptz := now() + interval '30 days';
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    if exists (
        select 1 from business_members m
         where m.user_id = v_uid and m.role = 'owner'
           and exists (select 1 from business_members o where o.business_id = m.business_id and o.user_id <> v_uid)) then
        raise exception 'Sahibi olduğun işletmede başka ekip üyeleri var. Önce onları ekipten çıkar.';
    end if;

    update profiles set deletion_requested_at = now(), deletion_scheduled_for = v_when where id = v_uid;

    perform enqueue_email(v_uid, 'Moffi · Hesap silme talebin alındı', 'Hesabın 30 gün sonra silinecek',
        'Hesabını ve verilerini silme talebini aldık. Hesabın ' || to_char(v_when at time zone 'Europe/Istanbul', 'DD.MM.YYYY') ||
        ' tarihinde kalıcı olarak silinecek. Bu tarihe kadar giriş yapıp "Silmeyi geri al" diyerek vazgeçebilirsin. Talebi sen yapmadıysan hemen giriş yapıp geri al ve şifreni değiştir.',
        '/home');
    return v_when;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    update profiles set deletion_requested_at = null, deletion_scheduled_for = null where id = auth.uid();
end;
$$;

-- Servis rolü: zamanı gelen hesaplar
create or replace function public.due_account_deletions(p_limit integer default 20)
returns setof uuid language sql security definer set search_path to 'public' as $$
    select id from profiles where deletion_scheduled_for <= now() order by deletion_scheduled_for limit least(greatest(p_limit, 1), 50);
$$;

-- Servis rolü: silmeden hemen önce başkalarına ait kayıtları koru
-- (işletmenin randevu geçmişi isimsiz kalır, tek sahipli işletme yayından kalkar).
create or replace function public.prepare_account_purge(p_user uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
    if not exists (select 1 from profiles where id = p_user and deletion_scheduled_for <= now()) then
        return false;
    end if;

    update appointments a
       set guest_name = coalesce(a.guest_name, 'Silinmiş kullanıcı'),
           guest_pet_name = coalesce(a.guest_pet_name, (select p.name from pets p where p.id = a.pet_id))
     where a.user_id = p_user;

    update businesses b set approved = false
     where b.id in (select business_id from business_members where user_id = p_user and role = 'owner')
       and not exists (select 1 from business_members o where o.business_id = b.id and o.user_id <> p_user);

    return true;
end;
$$;

revoke all on function public.request_account_deletion() from public, anon;
revoke all on function public.cancel_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
revoke all on function public.due_account_deletions(integer) from public, anon, authenticated;
revoke all on function public.prepare_account_purge(uuid) from public, anon, authenticated;
grant execute on function public.due_account_deletions(integer) to service_role;
grant execute on function public.prepare_account_purge(uuid) to service_role;

-- Her gece 03:00 (TR 06:00) zamanı gelen hesap varsa kalıcı silme uç noktası çağrılır
select cron.schedule('account-purge-daily', '0 3 * * *', $cmd$
  select net.http_post(
    url := 'https://app.moffi.net/api/cron/account-purge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_cron_secret')
    ),
    body := '{}'::jsonb
  )
  where exists (select 1 from public.profiles where deletion_scheduled_for <= now());
$cmd$);
