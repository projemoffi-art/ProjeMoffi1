-- 1. Create a Storage Bucket for SOS Images
insert into storage.buckets (id, name, public)
values ('sos_images', 'sos_images', true)
on conflict (id) do nothing;

create policy "Herkese Açık Okuma SOS"
on storage.objects for select
to public
using ( bucket_id = 'sos_images' );

create policy "Kullanıcılar SOS Yükleme Yapabilir"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'sos_images' );

-- 2. Create the 'lost_pets' Table
create table if not exists public.lost_pets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  author_name text not null,
  author_avatar text,
  pet_name text not null,
  pet_breed text,
  last_location text not null,
  description text,
  media_url text,
  status text default 'lost', -- 'lost' or 'found'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RL Policies for lost_pets
alter table public.lost_pets enable row level security;

create policy "Kayıp ilanlarını herkes görebilir"
on public.lost_pets for select
to public
using (true);

create policy "Sadece giriş yapanlar kayıp ilanı oluşturabilir"
on public.lost_pets for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Kullanıcılar kendi kayıp ilanlarını güncelleyebilir"
on public.lost_pets for update
to authenticated
using (auth.uid() = user_id);

create policy "Kullanıcılar kendi kayıp ilanlarını silebilir"
on public.lost_pets for delete
to authenticated
using (auth.uid() = user_id);
