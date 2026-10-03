-- Görev Merkezi v2 — çekirdek (Baran onayı 2026-10-03, design-reference/quests-final/).
-- İlke: görev tamamlanmasına SUNUCU karar verir (gerçek kayıttan), ödülü de sunucu verir. İstemci yalnızca okur.
-- Eski sistem (istemcinin claim_reward ile ödül istemesi, telefonda tutulan XP/rozet/pul) 20261004102700'de kapatılır.

-- ── Hayvan seviyesi: tek eğri, tek yer ──────────────────────────────────────
-- Seviye L için gereken toplam XP = 50·(L−1)·(L+2): 2→200, 3→500, 4→900, 5→1400, 6→2000, 10→5400.
create or replace function public.pet_level_for_xp(p_xp integer)
returns integer language sql immutable set search_path to 'public' as $$
    select greatest(1, floor((-1 + sqrt(9 + 8 * greatest(coalesce(p_xp, 0), 0) / 50.0)) / 2.0 + 1)::int);
$$;

create or replace function public.pet_level_info(p_xp integer)
returns json language plpgsql immutable set search_path to 'public' as $$
declare v_l int := pet_level_for_xp(p_xp); v_start int; v_next int;
begin
    -- Kayan nokta sınırında bir alt seviyeye düşmeyi önle
    while 50 * v_l * (v_l + 3) <= coalesce(p_xp, 0) loop v_l := v_l + 1; end loop;
    while v_l > 1 and 50 * (v_l - 1) * (v_l + 2) > coalesce(p_xp, 0) loop v_l := v_l - 1; end loop;
    v_start := 50 * (v_l - 1) * (v_l + 2);
    v_next := 50 * v_l * (v_l + 3);
    return json_build_object('level', v_l, 'xp', coalesce(p_xp, 0), 'level_start', v_start, 'level_next', v_next,
        'name', case when v_l <= 2 then 'Yeni Dost' when v_l <= 4 then 'Patili Arkadaş' when v_l <= 7 then 'Sadık Yoldaş'
                     when v_l <= 11 then 'Mahalle Kâşifi' else 'Efsane Dost' end);
end $$;

-- Mevcut hayvanların seviyesi yeni eğriyle
update public.pets set level = public.pet_level_for_xp(coalesce(xp, 0)) where level is distinct from public.pet_level_for_xp(coalesce(xp, 0));

-- ── Bakım kaydına "oyun" (kedi ve diğerleri için günlük hareket) ─────────────
alter table public.pet_daily_stats add column if not exists played_at timestamptz;

create or replace function public.log_pet_care(p_pet uuid, p_kind text, p_undo boolean DEFAULT false)
 returns json language plpgsql security definer set search_path to 'public' as $function$
declare
    v_day date := (now() at time zone 'Europe/Istanbul')::date;
begin
    if not exists (select 1 from public.pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    if p_kind not in ('meal', 'water', 'play') then
        raise exception 'Geçersiz kayıt türü' using errcode = '22023';
    end if;

    insert into public.pet_daily_stats (pet_id, date) values (p_pet, v_day)
    on conflict (pet_id, date) do nothing;

    if p_kind = 'meal' then
        update public.pet_daily_stats
           set meals_given = case when p_undo then greatest(meals_given - 1, 0) else least(meals_given + 1, 12) end,
               updated_at = now()
         where pet_id = p_pet and date = v_day;
    elsif p_kind = 'water' then
        update public.pet_daily_stats
           set water_refreshed_at = case when p_undo then null else now() end, updated_at = now()
         where pet_id = p_pet and date = v_day;
    else
        update public.pet_daily_stats
           set played_at = case when p_undo then null else now() end, updated_at = now()
         where pet_id = p_pet and date = v_day;
    end if;

    return public.pet_care_today(p_pet);
end $function$;

create or replace function public.pet_care_today(p_pet uuid)
 returns json language plpgsql stable security definer set search_path to 'public' as $function$
declare
    v_day date := (now() at time zone 'Europe/Istanbul')::date;
    v_row public.pet_daily_stats;
begin
    if not exists (select 1 from public.pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    select * into v_row from public.pet_daily_stats where pet_id = p_pet and date = v_day;
    return json_build_object(
        'date', v_day,
        'meals_given', coalesce(v_row.meals_given, 0),
        'meals_target', public.pet_meals_target(p_pet),
        'water_refreshed_at', v_row.water_refreshed_at,
        'played_at', v_row.played_at
    );
end $function$;

-- ── Günlük yürüyüş hedefi: tek kaynak sunucuda, gün içinde sabit ─────────────
-- Elle hedef hayvanın kaydında (eskiden yalnızca o telefonda); otomatik hedef BUGÜNDEN ÖNCEKİ yürüyüşlerden hesaplanır.
alter table public.pets add column if not exists walk_goal_km numeric(4,1);
alter table public.pets add constraint pets_walk_goal_km_range check (walk_goal_km is null or walk_goal_km between 0.5 and 20);

create or replace function public.pet_walk_goal_auto(p_pet uuid)
returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_pet record;
    v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_avg numeric; v_n int; v_goal numeric;
begin
    select size, birth_date into v_pet from pets where id = p_pet;
    select avg(km), count(*) into v_avg, v_n from (
        select distance_meters / 1000.0 km from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time < v_day_start and distance_meters > 200
         order by start_time desc limit 10) w;
    if v_n >= 3 then
        v_goal := least(greatest(round(v_avg * 1.1 * 2) / 2, 1.0), 8.0);
    else
        v_goal := case v_pet.size when 'Mini' then 1.0 when 'Küçük' then 1.5 when 'Büyük' then 2.5 when 'Dev' then 2.5 else 2.0 end;
    end if;
    if v_pet.birth_date is not null and v_pet.birth_date > (current_date - interval '6 months') then
        v_goal := least(v_goal, 1.0);
    end if;
    return v_goal;
end $$;

create or replace function public.pet_walk_goal(p_pet uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare v_manual numeric; v_auto numeric;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    select walk_goal_km into v_manual from pets where id = p_pet;
    v_auto := pet_walk_goal_auto(p_pet);
    return json_build_object('goal_km', coalesce(v_manual, v_auto), 'auto_km', v_auto, 'manual_km', v_manual);
end $$;

create or replace function public.set_pet_walk_goal(p_pet uuid, p_km numeric)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then
        raise exception 'Bu hayvan sana ait değil' using errcode = '42501';
    end if;
    if p_km is not null and (p_km < 0.5 or p_km > 20) then raise exception 'Hedef 0,5 ile 20 km arasında olmalı'; end if;
    update pets set walk_goal_km = case when p_km is null then null else round(p_km * 2) / 2 end where id = p_pet;
    return pet_walk_goal(p_pet);
end $$;

-- ── Ödül defteri: her ödül bir kez (kullanıcı + referans), PawCoin günlük tavan 200 ─────
create table if not exists public.quest_rewards (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    pet_id uuid references public.pets(id) on delete set null,
    ref text not null,
    label text not null,
    pawcoin integer not null default 0,
    xp integer not null default 0,
    created_at timestamptz not null default now(),
    unique (user_id, ref)
);
create index if not exists quest_rewards_user_day on public.quest_rewards (user_id, created_at);
alter table public.quest_rewards enable row level security;

-- İç fonksiyon: yalnızca diğer sunucu fonksiyonları çağırır. Verildiyse {granted, pawcoin, xp}, daha önce verildiyse granted=false.
create or replace function public.quest_grant(p_user uuid, p_pet uuid, p_ref text, p_label text, p_pawcoin integer, p_xp integer)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_used int; v_pc int; v_xp int := greatest(coalesce(p_xp, 0), 0);
begin
    perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':quest_grant', 0));
    if exists (select 1 from quest_rewards where user_id = p_user and ref = p_ref) then
        return json_build_object('granted', false, 'pawcoin', 0, 'xp', 0);
    end if;
    select coalesce(sum(pawcoin), 0) into v_used from quest_rewards where user_id = p_user and created_at >= v_day_start;
    v_pc := least(greatest(coalesce(p_pawcoin, 0), 0), greatest(200 - v_used, 0));
    insert into quest_rewards (user_id, pet_id, ref, label, pawcoin, xp) values (p_user, p_pet, p_ref, p_label, v_pc, v_xp);
    if v_pc > 0 then
        insert into point_transactions (user_id, amount, reason, source, reference_id) values (p_user, v_pc, p_label, 'quest', 'q:' || p_ref);
        update profiles set pati_puan_balance = coalesce(pati_puan_balance, 0) + v_pc where id = p_user;
    end if;
    if v_xp > 0 and p_pet is not null then
        update pets set xp = coalesce(xp, 0) + v_xp, level = pet_level_for_xp(coalesce(xp, 0) + v_xp) where id = p_pet;
    end if;
    return json_build_object('granted', true, 'pawcoin', v_pc, 'xp', v_xp, 'capped', v_pc < greatest(coalesce(p_pawcoin, 0), 0));
end $$;

-- ── Görev tanımları ─────────────────────────────────────────────────────────
create table if not exists public.quest_defs (
    key text primary key,
    scope text not null check (scope in ('core', 'pool')),
    title text not null,
    description text not null,
    why text not null,
    how text not null,
    icon text not null,
    category text not null,
    species text[],                -- null = hepsi; 'dog' | 'cat' | 'other'
    metric text not null,
    unit text not null default '',
    pawcoin integer not null,
    xp integer not null,
    route text not null,
    self_report boolean not null default false,
    priority integer not null default 0,
    sort integer not null default 0,
    active boolean not null default true
);
alter table public.quest_defs enable row level security;

insert into public.quest_defs (key, scope, title, description, why, how, icon, category, species, metric, unit, pawcoin, xp, route, self_report, priority, sort) values
('walk', 'core', 'Yürüyüş', 'Bugünkü yürüyüş hedefini tamamla',
 'Düzenli yürüyüş kilo kontrolüne, eklem sağlığına ve davranış sorunlarının azalmasına yardım eder. Koklayarak geçen yürüyüş zihinsel olarak da yorar.',
 'Yürüyüşü uygulamadan başlat; gün içindeki tüm yürüyüşlerin toplamı sayılır.', '🐾', 'hareket', array['dog'], 'walk_km_today', 'km', 10, 30, 'walk', false, 0, 1),
('play', 'core', 'Oyun zamanı', 'Bugün en az 10 dakika birlikte oyna',
 'Oyun, kedilerde avlanma içgüdüsünü güvenle karşılar; can sıkıntısı ve buna bağlı davranış sorunlarını azaltır.',
 'Olta oyuncağı ya da top ile 10 dakika oyna, sonra "Oynadık" de.', '🧶', 'hareket', array['cat','other'], 'played_today', 'kez', 5, 20, 'care:play', true, 0, 1),
('meals', 'core', 'Beslenme', 'Bugünkü öğünlerini ver ve işaretle',
 'Öğünleri düzenli saatlerde vermek sindirimi rahatlatır, iştah değişikliğini erken fark etmeni sağlar.',
 'Her öğünden sonra işaretle. Öğün sayısını hayvanın ayarlarından değiştirebilirsin.', '🍽️', 'bakim', null, 'meals_today', 'öğün', 5, 15, 'care:meal', true, 0, 2),
('water', 'core', 'Su', 'Su kabını tazele',
 'Taze ve temiz su böbrek sağlığı için önemlidir; bekleyen su bakteri üretir ve içme isteğini azaltır.',
 'Kabı yıka, taze su koy ve işaretle.', '💧', 'bakim', null, 'water_today', 'kez', 5, 10, 'care:water', true, 0, 3),
('vaccine_plan', 'pool', 'Aşı', 'Yaklaşan aşı için randevu planla',
 'Aşıları zamanında yaptırmak koruyuculuğun kesintisiz sürmesini sağlar.',
 'Veteriner ekranından randevu al ya da aşı yapıldıysa sağlık kaydına ekle.', '💉', 'saglik', null, 'vaccine_planned', 'kez', 10, 40, '/vet', false, 30, 10),
('emergency', 'pool', 'Acil durum bilgisi', 'Acil durumda aranacak kişiyi ekle',
 'Hayvanın kaybolur ya da sen ulaşılamaz olursan künyeyi okutan kişi bu bilgiyle yardım isteyebilir.',
 'Sağlık > Acil ekranında yedek iletişim kişisini doldur.', '🆘', 'saglik', null, 'emergency_set', 'kez', 10, 30, '/health/acil', false, 25, 11),
('passport', 'pool', 'Pasaport', 'Pasaportundaki bir eksik bilgiyi tamamla',
 'Eksiksiz pasaport, veterinerde ve kayıp durumunda zaman kazandırır.',
 'Kimlik ekranındaki boş alanlardan birini doldur.', '🪪', 'saglik', null, 'passport_filled', 'alan', 10, 30, '/pasaport/kimlik', false, 20, 12),
('weigh', 'pool', 'Kilo takibi', 'Bu hafta kilosunu tart ve kaydet',
 'Kilodaki küçük değişimler pek çok sağlık sorununun ilk işaretidir; haftalık takip erken fark ettirir.',
 'Kendini tart, sonra hayvanı kucağına alıp tekrar tart; fark hayvanın kilosudur. Sağlık > Kilo ekranına yaz.', '⚖️', 'saglik', null, 'weighed_today', 'kez', 10, 30, '/health/kilo', false, 10, 13),
('learn', 'pool', 'Günün bilgisi', 'Günün bilgisini oku',
 'Küçük ama düzenli bilgiler, hayvanının ihtiyaçlarını zamanla çok daha iyi tanımanı sağlar.',
 'Bilgi kartını sonuna kadar oku.', '💡', 'egitim', null, 'lesson_today', 'kez', 5, 20, '/quests/bilgi', false, 5, 14),
('photo', 'pool', 'Anı', 'Bugünün fotoğrafını albüme ekle',
 'Fotoğraflar hem anı hem de kilo, tüy ve göz değişimlerini zaman içinde karşılaştırmak için kayıttır.',
 'Albüme bir fotoğraf yükle.', '📸', 'ani', null, 'photo_today', 'kez', 10, 20, '/album', false, 0, 15),
('new_place', 'pool', 'Yeni rota', 'Daha önce yürümediğin bir yerde yürü',
 'Yeni kokular ve sesler köpek için güçlü bir zihinsel egzersizdir.',
 'Yürüyüşe daha önce başlamadığın bir noktadan başla (yaklaşık 1 km uzak).', '🧭', 'hareket', array['dog'], 'new_place_today', 'kez', 10, 30, 'walk', false, 0, 16),
('post_pet', 'pool', 'Paylaş', 'Hayvanını etiketleyerek bir anı paylaş',
 'Topluluk, benzer deneyimleri yaşayan sahiplerle tanışmanın en kolay yolu.',
 'Keşfet''te gönderi oluştururken hayvanını etiketle.', '✨', 'sosyal', null, 'post_today', 'kez', 5, 20, '/community', false, 0, 17)
on conflict (key) do update set scope = excluded.scope, title = excluded.title, description = excluded.description, why = excluded.why,
    how = excluded.how, icon = excluded.icon, category = excluded.category, species = excluded.species, metric = excluded.metric,
    unit = excluded.unit, pawcoin = excluded.pawcoin, xp = excluded.xp, route = excluded.route, self_report = excluded.self_report,
    priority = excluded.priority, sort = excluded.sort;

-- ── Günün görevleri (sabitlenmiş): her hayvan için günde bir kez üretilir ───────
create table if not exists public.pet_daily_quests (
    pet_id uuid not null references public.pets(id) on delete cascade,
    day date not null,
    quest_key text not null references public.quest_defs(key),
    target numeric not null,
    baseline numeric not null default 0,
    progress numeric not null default 0,
    completed_at timestamptz,
    rerolled boolean not null default false,
    created_at timestamptz not null default now(),
    primary key (pet_id, day, quest_key)
);
alter table public.pet_daily_quests enable row level security;

-- ── Haftalık sandık ─────────────────────────────────────────────────────────
create table if not exists public.pet_week_chests (
    pet_id uuid not null references public.pets(id) on delete cascade,
    week_start date not null,
    opened_at timestamptz not null default now(),
    primary key (pet_id, week_start)
);
alter table public.pet_week_chests enable row level security;

-- ── Rozetler ────────────────────────────────────────────────────────────────
create table if not exists public.badge_defs (
    key text primary key,
    family text not null,
    tier integer not null default 1,
    title text not null,
    description text not null,
    icon text not null,
    category text not null check (category in ('yuruyus', 'saglik', 'egitim', 'sosyal', 'kesif', 'ozel')),
    metric text not null,
    threshold numeric not null,
    unit text not null default '',
    pawcoin integer not null default 0,
    xp integer not null default 0,
    hidden boolean not null default false,
    sort integer not null default 0
);
alter table public.badge_defs enable row level security;

create table if not exists public.pet_badges (
    pet_id uuid not null references public.pets(id) on delete cascade,
    badge_key text not null references public.badge_defs(key),
    earned_at timestamptz not null default now(),
    featured boolean not null default false,
    primary key (pet_id, badge_key)
);
alter table public.pet_badges enable row level security;

insert into public.badge_defs (key, family, tier, title, description, icon, category, metric, threshold, unit, pawcoin, xp, hidden, sort) values
('first_step', 'walks', 1, 'İlk Yürüyüş', 'İlk yürüyüşünü tamamladın', '🥾', 'yuruyus', 'walk_count', 1, 'yürüyüş', 25, 50, false, 1),
('walks_10', 'walks', 2, 'Alışkanlık', '10 yürüyüş tamamladın', '🐕', 'yuruyus', 'walk_count', 10, 'yürüyüş', 50, 100, false, 2),
('walks_50', 'walks', 3, 'Düzenli Yürüyüşçü', '50 yürüyüş tamamladın', '🦮', 'yuruyus', 'walk_count', 50, 'yürüyüş', 100, 200, false, 3),
('walks_100', 'walks', 4, 'Yüzüncü Yürüyüş', '100 yürüyüş tamamladın', '🎖️', 'yuruyus', 'walk_count', 100, 'yürüyüş', 150, 300, false, 4),
('walks_365', 'walks', 5, 'Her Gün Bir Yürüyüş', '365 yürüyüş tamamladın', '🏵️', 'yuruyus', 'walk_count', 365, 'yürüyüş', 250, 500, false, 5),
('dist_10', 'distance', 1, 'İlk Kilometreler', 'Toplam 10 km yürüdünüz', '👣', 'yuruyus', 'walk_km', 10, 'km', 25, 50, false, 10),
('dist_50', 'distance', 2, 'Yürüyüş Şampiyonu', 'Toplam 50 km yürüdünüz', '🏆', 'yuruyus', 'walk_km', 50, 'km', 100, 50, false, 11),
('explorer_100', 'distance', 3, 'Büyük Kâşif', 'Toplam 100 km yürüdünüz', '🌍', 'yuruyus', 'walk_km', 100, 'km', 150, 200, false, 12),
('dist_250', 'distance', 4, 'Yorulmaz Gezgin', 'Toplam 250 km yürüdünüz', '🧭', 'yuruyus', 'walk_km', 250, 'km', 200, 300, false, 13),
('dist_500', 'distance', 5, 'Menzil Ustası', 'Toplam 500 km yürüdünüz', '🚀', 'yuruyus', 'walk_km', 500, 'km', 250, 400, false, 14),
('dist_1000', 'distance', 6, 'Efsanevi Yürüyüşçü', 'Toplam 1000 km yürüdünüz', '🌌', 'yuruyus', 'walk_km', 1000, 'km', 250, 500, false, 15),
('morning_bird', 'morning', 1, 'Sabah Kuşu', 'Sabah 07.00''den önce yürüdünüz', '🌅', 'yuruyus', 'morning_walks', 1, 'yürüyüş', 25, 50, true, 16),
('night_walker', 'night', 1, 'Gece Gezgini', 'Akşam 21.00''den sonra yürüdünüz', '🌙', 'yuruyus', 'night_walks', 1, 'yürüyüş', 25, 50, true, 17),
('regions_5', 'regions', 1, 'Kâşif', '5 farklı bölgede yürüdünüz', '🗺️', 'kesif', 'regions', 5, 'bölge', 50, 100, false, 20),
('region_explorer', 'regions', 2, 'Şehir Kâşifi', '10 farklı bölgede yürüdünüz', '🏙️', 'kesif', 'regions', 10, 'bölge', 100, 200, false, 21),
('regions_25', 'regions', 3, 'Şehrin Efsanesi', '25 farklı bölgede yürüdünüz', '🌆', 'kesif', 'regions', 25, 'bölge', 200, 300, false, 22),
('water_7', 'water', 1, 'Su Dostu', '7 gün suyunu tazeledin', '💧', 'saglik', 'water_days', 7, 'gün', 25, 50, false, 30),
('water_30', 'water', 2, 'Su Ustası', '30 gün suyunu tazeledin', '🌊', 'saglik', 'water_days', 30, 'gün', 50, 100, false, 31),
('water_100', 'water', 3, 'Su Kahramanı', '100 gün suyunu tazeledin', '🫧', 'saglik', 'water_days', 100, 'gün', 150, 200, false, 32),
('care_7', 'meals', 1, 'Beslenme Uzmanı', '7 gün öğünlerini eksiksiz verdin', '🍽️', 'saglik', 'meal_days', 7, 'gün', 25, 50, false, 33),
('care_30', 'meals', 2, 'Özenli Sahip', '30 gün öğünlerini eksiksiz verdin', '🥣', 'saglik', 'meal_days', 30, 'gün', 50, 100, false, 34),
('care_100', 'meals', 3, 'Bakım Ustası', '100 gün öğünlerini eksiksiz verdin', '🌟', 'saglik', 'meal_days', 100, 'gün', 150, 200, false, 35),
('vet_1', 'vet', 1, 'Veteriner Kahramanı', 'İlk aşı ya da muayene kaydı', '🩺', 'saglik', 'vet_visits', 1, 'kayıt', 50, 100, false, 36),
('vet_5', 'vet', 2, 'Sağlık Bekçisi', '5 aşı ya da muayene kaydı', '🛡️', 'saglik', 'vet_visits', 5, 'kayıt', 100, 200, false, 37),
('weigh_4', 'weigh', 1, 'Kilo Takipçisi', '4 kez kilo kaydettin', '⚖️', 'saglik', 'weigh_count', 4, 'kayıt', 25, 50, false, 38),
('weigh_12', 'weigh', 2, 'Formda', '12 kez kilo kaydettin', '💪', 'saglik', 'weigh_count', 12, 'kayıt', 50, 100, false, 39),
('lessons_5', 'lessons', 1, 'Meraklı Öğrenci', '5 bilgi kartı okudun', '💡', 'egitim', 'lessons', 5, 'bilgi', 25, 50, false, 40),
('lessons_20', 'lessons', 2, 'Bilgili Sahip', '20 bilgi kartı okudun', '📚', 'egitim', 'lessons', 20, 'bilgi', 50, 100, false, 41),
('lessons_50', 'lessons', 3, 'Pati Profesörü', '50 bilgi kartı okudun', '🎓', 'egitim', 'lessons', 50, 'bilgi', 150, 200, false, 42),
('program_1', 'programs', 1, 'Program Mezunu', 'İlk programını bitirdin', '📜', 'egitim', 'programs_done', 1, 'program', 50, 100, false, 43),
('program_3', 'programs', 2, 'Azimli', '3 program bitirdin', '🏅', 'egitim', 'programs_done', 3, 'program', 100, 200, false, 44),
('first_post', 'posts', 1, 'Sosyal Pati', 'Hayvanını etiketleyerek ilk paylaşımını yaptın', '✨', 'sosyal', 'posts_with_pet', 1, 'paylaşım', 25, 50, false, 50),
('photographer', 'posts', 2, 'Fotoğrafçı', '10 paylaşımda hayvanını etiketledin', '📸', 'sosyal', 'posts_with_pet', 10, 'paylaşım', 50, 100, false, 51),
('posts_25', 'posts', 3, 'İçerik Üretici', '25 paylaşımda hayvanını etiketledin', '🖼️', 'sosyal', 'posts_with_pet', 25, 'paylaşım', 100, 200, false, 52),
('team_1', 'teams', 1, 'Takım Oyuncusu', 'Bir ortak hedefi arkadaşlarınla tamamladın', '🤝', 'sosyal', 'teams_done', 1, 'hedef', 50, 100, false, 53),
('loyal_4', 'chests', 1, 'Sadık Dost', '4 haftalık sandık açtın', '🎁', 'ozel', 'chests', 4, 'sandık', 50, 100, false, 60),
('loyal_12', 'chests', 2, 'Vefalı Dost', '12 haftalık sandık açtın', '💝', 'ozel', 'chests', 12, 'sandık', 100, 200, false, 61),
('loyal_52', 'chests', 3, 'Bir Yıllık Dost', '52 haftalık sandık açtın', '👑', 'ozel', 'chests', 52, 'sandık', 250, 500, false, 62)
on conflict (key) do update set family = excluded.family, tier = excluded.tier, title = excluded.title, description = excluded.description,
    icon = excluded.icon, category = excluded.category, metric = excluded.metric, threshold = excluded.threshold, unit = excluded.unit,
    pawcoin = excluded.pawcoin, xp = excluded.xp, hidden = excluded.hidden, sort = excluded.sort;

-- İç yardımcılar ve tanım tabloları istemciye kapalı (yalnızca sunucu fonksiyonları kullanır).
revoke execute on function public.quest_grant(uuid, uuid, text, text, integer, integer), public.pet_walk_goal_auto(uuid) from public, anon, authenticated;
revoke execute on function public.pet_level_for_xp(integer), public.pet_level_info(integer) from public, anon;
grant execute on function public.pet_level_for_xp(integer), public.pet_level_info(integer) to authenticated;
revoke execute on function public.pet_walk_goal(uuid), public.set_pet_walk_goal(uuid, numeric) from public, anon;
grant execute on function public.pet_walk_goal(uuid), public.set_pet_walk_goal(uuid, numeric) to authenticated;
