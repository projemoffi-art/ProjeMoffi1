-- Görev Merkezi v2 — içerik ve sosyal tablolar. İstemcinin bu tablolara doğrudan erişimi yok (RLS açık, politika yok);
-- okuma/yazma yalnızca 20261004102500'deki sunucu fonksiyonlarıyla.
-- İçerik (bilgi kartı, program, macera) yayına alınmadan önce bir veterinerin okuması gerekir (vet_reviewed; CLAUDE.md 12.1).

-- Günün bilgisi
create table if not exists public.lessons (
    id text primary key,
    title text not null,
    summary text not null,
    body jsonb not null,                 -- [{ "h": "ara başlık"?, "p": "paragraf" }]
    tip text,
    species text[],                      -- null = hepsi
    category text not null,
    read_minutes integer not null default 2,
    emoji text not null,
    tint text not null default '#FCE6DF',
    source text not null,
    sort integer not null default 0,
    published boolean not null default true,
    vet_reviewed boolean not null default false,
    created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;

create table if not exists public.lesson_reads (
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id text not null references public.lessons(id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (user_id, lesson_id)
);
alter table public.lesson_reads enable row level security;

-- Programlar (çok günlü, öğretici)
create table if not exists public.programs (
    key text primary key,
    title text not null,
    subtitle text not null,
    description text not null,
    species text[],
    tags text[] not null default '{}',   -- 'egitim' | 'saglik' | 'yeni' | 'sosyal'
    emoji text not null,
    tint text not null default '#FCE6DF',
    badge_key text references public.badge_defs(key),
    pawcoin integer not null default 100,
    xp integer not null default 300,
    steps jsonb not null,                -- [{ "title", "body", "tip"? }] — gün sırası dizideki sıra
    sort integer not null default 0,
    published boolean not null default true,
    vet_reviewed boolean not null default false
);
alter table public.programs enable row level security;

create table if not exists public.pet_programs (
    pet_id uuid not null references public.pets(id) on delete cascade,
    program_key text not null references public.programs(key) on delete cascade,
    started_at timestamptz not null default now(),
    steps_done integer not null default 0,
    last_step_on date,
    completed_at timestamptz,
    status text not null default 'active' check (status in ('active', 'left', 'done')),
    primary key (pet_id, program_key)
);
alter table public.pet_programs enable row level security;

-- Aylık macera
create table if not exists public.adventures (
    month text primary key check (month ~ '^\d{4}-\d{2}$'),
    title text not null,
    subtitle text not null,
    story text not null,
    emoji text not null,
    tint text not null default '#FCE6DF',
    badge_key text not null references public.badge_defs(key),
    final_pawcoin integer not null default 100,
    final_xp integer not null default 200,
    stages jsonb not null,               -- [{ title, story, emoji, pawcoin, xp, goals: [{ metric, target, label, alt? }] }]
    published boolean not null default true,
    vet_reviewed boolean not null default false
);
alter table public.adventures enable row level security;

-- Birlikte: 2–5 kişilik ortak hedef
create table if not exists public.team_goals (
    id uuid primary key default gen_random_uuid(),
    creator_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    kind text not null check (kind in ('walk_km', 'walk_days', 'care_days', 'lessons')),
    target numeric not null check (target > 0),
    starts_at timestamptz not null default now(),
    ends_at timestamptz not null,
    status text not null default 'active' check (status in ('active', 'completed', 'expired', 'cancelled')),
    completed_at timestamptz,
    created_at timestamptz not null default now()
);
alter table public.team_goals enable row level security;

create table if not exists public.team_goal_members (
    goal_id uuid not null references public.team_goals(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'left')),
    joined_at timestamptz,
    primary key (goal_id, user_id)
);
create index if not exists team_goal_members_user on public.team_goal_members (user_id);
alter table public.team_goal_members enable row level security;
