-- Mesajlar Tablosu (Direct Messages arası)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  content text not null,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Kullanıcılar sadece kendi mesajlarını okuyabilir"
on public.messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Kullanıcılar mesaj gönderebilir"
on public.messages for insert
to authenticated
with check (auth.uid() = sender_id);


-- SOS Görülme Bildirimleri (Anonim Konum)
drop table if exists public.sos_sightings cascade;

create table if not exists public.sos_sightings (
  id uuid default gen_random_uuid() primary key,
  lost_pet_id uuid references public.lost_pets on delete cascade not null,
  reporter_id uuid references auth.users not null,
  seen_area text not null,
  anonymity_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sos_sightings enable row level security;

create policy "Herkes sightings görebilir (MVP için)"
on public.sos_sightings for select
to public
using (true);

create policy "Giriş yapanlar sighting bildirebilir"
on public.sos_sightings for insert
to authenticated
with check (auth.uid() = reporter_id);
