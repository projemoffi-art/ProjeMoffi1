-- Giriş + ilk kurulum (design-reference/onboarding-final): pet alanları, onay kaydı, kurulum durumu,
-- kullanıcı adı / varsayılan avatar düzeltmesi.

-- 1) Pet: çoklu fotoğraf, belirgin özellikler, tahmini doğum tarihi işareti
alter table public.pets add column if not exists gallery_urls text[] not null default '{}';
alter table public.pets add column if not exists features text[] not null default '{}';
alter table public.pets add column if not exists birth_date_estimated boolean not null default false;

-- 2) Profil: onay kaydı (KVKK) ve kurulum durumu
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists marketing_consent boolean not null default false;
alter table public.profiles add column if not exists marketing_consent_at timestamptz;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

-- Mevcut kullanıcılar kurulum akışına zorlanmaz
update public.profiles set onboarding_completed_at = coalesce(onboarding_completed_at, now());

-- Onay/kurulum alanlarını istemci değiştiremez: onay kaydı sunucuda (kayıt tetikleyicisi), kurulum tamamlama
-- complete_onboarding() ile.
create or replace function public.guard_profile_consent() returns trigger language plpgsql as $$
begin
    if current_user in ('authenticated', 'anon') then
        new.terms_accepted_at := old.terms_accepted_at;
        new.terms_version := old.terms_version;
        new.marketing_consent_at := old.marketing_consent_at;
        new.onboarding_completed_at := old.onboarding_completed_at;
    end if;
    return new;
end;
$$;

do $$ begin
    if not exists (select 1 from pg_trigger where tgname = 'profiles_guard_consent') then
        create trigger profiles_guard_consent before update on public.profiles
            for each row execute function public.guard_profile_consent();
    end if;
end $$;

create or replace function public.complete_onboarding() returns void
language plpgsql security definer set search_path to 'public' as $$
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    update profiles set onboarding_completed_at = coalesce(onboarding_completed_at, now()) where id = auth.uid();
end;
$$;
revoke all on function public.complete_onboarding() from public, anon;
grant execute on function public.complete_onboarding() to authenticated;

-- Pazarlama izni sonradan açılıp kapatılabilir (tarihi sunucu yazar)
create or replace function public.set_marketing_consent(p_value boolean) returns void
language plpgsql security definer set search_path to 'public' as $$
begin
    if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
    update profiles set marketing_consent = p_value, marketing_consent_at = now() where id = auth.uid();
end;
$$;
revoke all on function public.set_marketing_consent(boolean) from public, anon;
grant execute on function public.set_marketing_consent(boolean) to authenticated;

-- 3) Yeni kullanıcı: onay kaydı, e-postadan türemeyen kullanıcı adı, rastgele insan fotoğrafı YOK
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
    v_name text := nullif(trim(new.raw_user_meta_data->>'full_name'), '');
    v_base text;
    v_username text;
    v_marketing boolean := coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false);
begin
    v_base := regexp_replace(lower(translate(coalesce(v_name, 'moffi'),
                  'çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU')), '[^a-z0-9]+', '', 'g');
    if length(v_base) < 3 then v_base := 'moffi'; end if;
    v_username := coalesce(nullif(new.raw_user_meta_data->>'username', ''),
                           left(v_base, 20) || substr(md5(new.id::text), 1, 4));
    insert into public.profiles (id, full_name, username, avatar_url, terms_accepted_at, terms_version, marketing_consent, marketing_consent_at)
    values (new.id, v_name, v_username, null, now(), '2026-10', v_marketing, case when v_marketing then now() end)
    on conflict (id) do nothing;
    return new;
end;
$$;

-- 4) Mevcut profiller: e-posta başından türeyen kullanıcı adı ve rastgele insan fotoğrafı düzeltilir
update public.profiles p
   set username = left(coalesce(nullif(regexp_replace(lower(translate(coalesce(nullif(trim(p.full_name), ''), 'moffi'),
                       'çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU')), '[^a-z0-9]+', '', 'g'), ''), 'moffi'), 20) || substr(md5(p.id::text), 1, 4)
  from auth.users u
 where u.id = p.id and p.role = 'user' and lower(p.username) = lower(split_part(u.email, '@', 1));

update public.profiles set avatar_url = null where avatar_url like 'https://i.pravatar.cc%';
