-- 1. Create a Storage Bucket for Post Images
insert into storage.buckets (id, name, public)
values ('post_images', 'post_images', true)
on conflict (id) do nothing;

create policy "Herkese Açık Okuma"
on storage.objects for select
to public
using ( bucket_id = 'post_images' );

create policy "Kullanıcılar Yükleme Yapabilir"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'post_images' );

-- 2. Create the 'posts' Table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  author_name text not null,
  author_avatar text,
  media_url text not null,
  description text,
  mood text,
  location_name text default 'Şu an yanınızda',
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RL Policies for posts
alter table public.posts enable row level security;

create policy "Gönderileri herkes görebilir"
on public.posts for select
to public
using (true);

create policy "Sadece giriş yapanlar gönderi oluşturabilir"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Kullanıcılar kendi gönderilerini silebilir"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

-- 3. Create 'likes' Table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Beğenileri herkes görebilir"
on public.likes for select
to public
using (true);

create policy "Kullanıcılar beğeni ekleyebilir"
on public.likes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Kullanıcılar kendi beğenilerini çekebilir"
on public.likes for delete
to authenticated
using (auth.uid() = user_id);

-- 4. Create 'comments' Table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users not null,
  author_name text not null,
  author_avatar text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Yorumları herkes görebilir"
on public.comments for select
to public
using (true);

create policy "Giriş yapanlar yorum yapabilir"
on public.comments for insert
to authenticated
with check (auth.uid() = user_id);
