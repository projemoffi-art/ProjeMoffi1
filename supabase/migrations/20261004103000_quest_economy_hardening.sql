-- Görev Merkezi ekonomi denetimi (2026-10-04). Bulunan açıklar ve düzeltmeler:
-- 1) PawCoin hayvan başınaydı: 10 hayvanlı (ya da sahte hayvan açan) hesap aynı görevden 10 kez PawCoin alıyordu; hayvan silip
--    yeniden açınca rozet PawCoin'i yeniden geliyordu. Artık PawCoin HESAP başına: ödül anahtarından hayvan kimliği çıkarılınca
--    aynı olan ödül (coin_ref) hesaba bir kez PawCoin verir. XP ve rozet hayvan başına kalır.
-- 2) Düello hiç yürümeden iki tarafa 150, kazanana 300 PawCoin veriyordu (günlük tavan dışı). Artık en az 1 km yürüyen tarafa 30,
--    kazanana +30; ödül quest_grant'tan (defter + günlük tavan). Eski "takım" modu (yerini ortak hedef aldı) yeni açılamaz.
-- 3) Ortak hedef: tek kişi, 1 birimlik hedefle anında tamamlanıp sınırsız tekrar edilebiliyordu; bakım günleri hayvan sayısıyla
--    çarpılıyordu, katılmadan önceki kayıt sayılıyordu. Artık en az 2 kabul eden üye, en düşük hedef, katılma anından sonrası,
--    bakım günü hesap başına; Birlikte ödülleri (ortak hedef + düello) haftada en çok 120 PawCoin.
-- 4) Rozet ölçümleri tekrarla şişiriliyordu: 10 saniyelik yürüyüş "yürüyüş" sayılıyordu, kilo/aşı/gönderi aynı gün art arda
--    girilebiliyordu. Artık yürüyüş en az 300 m ya da 10 dk; kilo, veteriner kaydı ve gönderi GÜN olarak sayılır.
-- 5) Pasaport/acil bilgi görevi alan silip yeniden doldurarak her gün alınabiliyordu: aynı hayvanda 30 günde bir.
-- 6) Hesap başına en çok 10 hayvan.

-- ── 1. Hesap başına PawCoin ─────────────────────────────────────────────────
-- Hayvana bağlı ödül anahtarlarında 2. parça hayvan kimliğidir (dq:<pet>:<gün>:<görev>, chest:<pet>:<hafta>, badge:<pet>:<rozet>…).
create or replace function public.qc_coin_ref(p_ref text) returns text
language sql immutable set search_path to 'public' as $$
    select case when split_part(p_ref, ':', 1) in ('dq', 'dqall', 'chest', 'badge', 'adv', 'advfinal', 'pstep', 'program')
                then regexp_replace(p_ref, '^([^:]+):[^:]+', '\1') else p_ref end
$$;

alter table public.quest_rewards add column if not exists coin_ref text;
with c as (
    select id, qc_coin_ref(ref) cr, row_number() over (partition by user_id, qc_coin_ref(ref) order by created_at, id) rn
      from public.quest_rewards where pawcoin > 0 and coin_ref is null)
update public.quest_rewards q set coin_ref = c.cr from c where q.id = c.id and c.rn = 1;
create unique index if not exists quest_rewards_coin_ref_uq on public.quest_rewards (user_id, coin_ref) where coin_ref is not null;

-- Bu ödülün PawCoin'i hâlâ alınabilir mi (başka bir hayvanla alınmadıysa true; kendisi aldıysa da true)
create or replace function public.qc_coin_open(p_user uuid, p_ref text) returns boolean
language sql stable security definer set search_path to 'public' as $$
    select not exists (select 1 from quest_rewards where user_id = p_user and coin_ref = qc_coin_ref(p_ref) and ref <> p_ref)
$$;

create or replace function public.quest_grant(p_user uuid, p_pet uuid, p_ref text, p_label text, p_pawcoin integer, p_xp integer)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_want int := greatest(coalesce(p_pawcoin, 0), 0); v_used int; v_pc int := 0; v_xp int := greatest(coalesce(p_xp, 0), 0);
    v_coin text := qc_coin_ref(p_ref); v_taken boolean := false;
begin
    perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':quest_grant', 0));
    if exists (select 1 from quest_rewards where user_id = p_user and ref = p_ref) then
        return json_build_object('granted', false, 'pawcoin', 0, 'xp', 0);
    end if;
    if v_want > 0 then
        v_taken := exists (select 1 from quest_rewards where user_id = p_user and coin_ref = v_coin);
        if not v_taken then
            select coalesce(sum(pawcoin), 0) into v_used from quest_rewards where user_id = p_user and created_at >= v_day_start;
            v_pc := least(v_want, greatest(200 - v_used, 0));
        end if;
    end if;
    insert into quest_rewards (user_id, pet_id, ref, label, pawcoin, xp, coin_ref)
    values (p_user, p_pet, p_ref, p_label, v_pc, v_xp, case when v_want > 0 and not v_taken then v_coin end);
    if v_pc > 0 then
        insert into point_transactions (user_id, amount, reason, source, reference_id) values (p_user, v_pc, p_label, 'quest', 'q:' || p_ref);
        update profiles set pati_puan_balance = coalesce(pati_puan_balance, 0) + v_pc where id = p_user;
    end if;
    if v_xp > 0 and p_pet is not null then
        update pets set xp = coalesce(xp, 0) + v_xp, level = pet_level_for_xp(coalesce(xp, 0) + v_xp) where id = p_pet;
    end if;
    return json_build_object('granted', true, 'pawcoin', v_pc, 'xp', v_xp, 'shared', v_taken, 'capped', not v_taken and v_pc < v_want);
end $$;

-- ── 4. Ölçüm: tekrarla şişirilemeyen sayımlar ────────────────────────────────
create or replace function public.pet_metric(p_pet uuid, p_metric text, p_from timestamptz, p_to timestamptz)
returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_owner uuid;
    v_from_d date := case when p_from = '-infinity'::timestamptz then '-infinity'::date else (p_from at time zone 'Europe/Istanbul')::date end;
    v_to_d date := case when p_to = 'infinity'::timestamptz then 'infinity'::date else (p_to at time zone 'Europe/Istanbul')::date end;
    v numeric := 0;
begin
    select owner_id into v_owner from pets where id = p_pet;
    if v_owner is null then return 0; end if;

    -- Sayılan yürüyüş: en az 300 m ya da 10 dakika (art arda başlat-bitir ile rozet toplanamaz). Mesafe toplamı her yürüyüşü sayar.
    if p_metric = 'walk_km' then
        select coalesce(sum(distance_meters), 0) / 1000.0 into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_metric = 'walk_count' then
        select count(*) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to
           and (distance_meters >= 300 or active_seconds >= 600);
    elsif p_metric = 'walk_days' then
        select count(distinct (start_time at time zone 'Europe/Istanbul')::date) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to
           and (distance_meters >= 300 or active_seconds >= 600);
    elsif p_metric = 'morning_walks' then
        select count(*) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to
           and (distance_meters >= 300 or active_seconds >= 600)
           and extract(hour from start_time at time zone 'Europe/Istanbul') < 7;
    elsif p_metric = 'night_walks' then
        select count(*) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to
           and (distance_meters >= 300 or active_seconds >= 600)
           and extract(hour from start_time at time zone 'Europe/Istanbul') >= 21;
    elsif p_metric = 'regions' then
        -- ~1 km'lik hücreler (2 ondalık); başlangıç noktası farklı hücrede olan yürüyüşler farklı bölge
        select count(*) into v from (
            select distinct round(start_lat::numeric, 2), round(start_lng::numeric, 2) from walk_sessions
             where pet_id = p_pet::text and status = 'completed' and start_lat is not null
               and (distance_meters >= 300 or active_seconds >= 600)
               and start_time >= p_from and start_time < p_to) x;
    elsif p_metric = 'new_places' then
        select count(*) into v from (
            select distinct round(start_lat::numeric, 2) a, round(start_lng::numeric, 2) b from walk_sessions
             where pet_id = p_pet::text and status = 'completed' and start_lat is not null
               and (distance_meters >= 300 or active_seconds >= 600) and start_time >= p_from and start_time < p_to
            except
            select distinct round(start_lat::numeric, 2), round(start_lng::numeric, 2) from walk_sessions
             where pet_id = p_pet::text and status = 'completed' and start_lat is not null and start_time < p_from) x;
    elsif p_metric in ('meal_days', 'water_days', 'play_days', 'care_days') then
        select count(*) into v from pet_daily_stats s
         where s.pet_id = p_pet and s.date >= v_from_d and s.date < v_to_d
           and case p_metric
                 when 'meal_days' then s.meals_given >= pet_meals_target(p_pet)
                 when 'water_days' then s.water_refreshed_at is not null
                 when 'play_days' then s.played_at is not null
                 else s.meals_given >= pet_meals_target(p_pet) and s.water_refreshed_at is not null end;
    -- Sahibinin kendi girdiği kayıtlar GÜN olarak sayılır (girildiği gün; geçmiş tarihle toplu giriş rozet doldurmaz)
    elsif p_metric = 'weigh_count' then
        select count(distinct (created_at at time zone 'Europe/Istanbul')::date) into v from pet_weight_logs
         where pet_id = p_pet and created_at >= p_from and created_at < p_to;
    elsif p_metric = 'vet_visits' then
        select count(*) into v from (
            select (created_at at time zone 'Europe/Istanbul')::date d from vaccines where pet_id = p_pet and created_at >= p_from and created_at < p_to
            union
            select (created_at at time zone 'Europe/Istanbul')::date from medical_records where pet_id = p_pet and created_at >= p_from and created_at < p_to) x;
    elsif p_metric = 'photo_count' then
        select (select count(*) from pet_media where pet_id = p_pet and status = 'ready' and created_at >= p_from and created_at < p_to)
             + (select count(*) from posts where p_pet = any(tagged_pet_ids) and status = 'published' and created_at >= p_from and created_at < p_to)
          into v;
    elsif p_metric = 'posts_with_pet' then
        select count(distinct (created_at at time zone 'Europe/Istanbul')::date) into v from posts
         where p_pet = any(tagged_pet_ids) and status = 'published' and created_at >= p_from and created_at < p_to;
    elsif p_metric = 'lessons' then
        select count(*) into v from lesson_reads where user_id = v_owner and read_at >= p_from and read_at < p_to;
    elsif p_metric = 'chests' then
        select count(*) into v from pet_week_chests where pet_id = p_pet and opened_at >= p_from and opened_at < p_to;
    elsif p_metric = 'programs_done' then
        select count(*) into v from pet_programs where pet_id = p_pet and status = 'done' and completed_at >= p_from and completed_at < p_to;
    elsif p_metric = 'teams_done' then
        select count(*) into v from team_goal_members m join team_goals g on g.id = m.goal_id
         where m.user_id = v_owner and m.status = 'accepted' and g.status = 'completed' and g.completed_at >= p_from and g.completed_at < p_to;
    end if;
    return coalesce(v, 0);
end $$;

-- ── 5. Pasaport / acil bilgi: aynı hayvanda 30 günde bir ─────────────────────
create or replace function public.qc_pool_eligible(p_pet uuid)
returns table (key text, priority integer) language plpgsql stable security definer set search_path to 'public' as $$
declare v_sp text := pet_species(p_pet); v_owner uuid;
begin
    select owner_id into v_owner from pets where id = p_pet;
    return query
    select d.key, d.priority from quest_defs d
     where d.scope = 'pool' and d.active and (d.species is null or v_sp = any(d.species))
       and case d.key
             when 'vaccine_plan' then exists (select 1 from vaccines v where v.pet_id = p_pet and v.next_due_date between now() - interval '60 days' and now() + interval '30 days')
                                  and not exists (select 1 from appointments a where a.pet_id = p_pet and a.appointment_date > now() and a.status in ('pending', 'confirmed'))
             when 'emergency' then not pet_emergency_set(p_pet)
                                  and not exists (select 1 from pet_daily_quests q where q.pet_id = p_pet and q.quest_key = 'emergency' and q.completed_at > now() - interval '30 days')
             when 'passport' then pet_passport_missing(p_pet) > 0
                                  and not exists (select 1 from pet_daily_quests q where q.pet_id = p_pet and q.quest_key = 'passport' and q.completed_at > now() - interval '30 days')
             when 'weigh' then not exists (select 1 from pet_weight_logs w where w.pet_id = p_pet and w.created_at >= now() - interval '7 days')
             when 'learn' then exists (select 1 from lessons l where l.published and (l.species is null or v_sp = any(l.species))
                                         and not exists (select 1 from lesson_reads r where r.user_id = v_owner and r.lesson_id = l.id))
             when 'new_place' then exists (select 1 from walk_sessions w where w.pet_id = p_pet::text and w.status = 'completed' and w.start_lat is not null)
             when 'post_pet' then not exists (select 1 from posts p where p_pet = any(p.tagged_pet_ids) and p.status = 'published' and p.created_at >= now() - interval '7 days')
             else true end;
end $$;

-- ── Ekranlar gösterdiği PawCoin'i hesap kuralına göre verir ──────────────────
create or replace function public.qc_week_state(p_pet uuid, p_week date)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_sp text := pet_species(p_pet); v_owner uuid; v_open boolean;
    v_from timestamptz := qc_ts(p_week); v_to timestamptz := qc_ts(p_week + 7);
    v_goals json; v_done boolean; v_perk text; v_perk_name text;
begin
    select owner_id into v_owner from pets where id = p_pet;
    v_open := qc_coin_open(v_owner, 'chest:' || p_pet || ':' || p_week);
    with g(key, label, target) as (
        values (case when v_sp = 'dog' then 'walk_days' else 'play_days' end,
                case when v_sp = 'dog' then '3 gün yürüyüş yap' else '3 gün birlikte oyna' end, 3),
               ('water_days', '4 gün suyunu tazele', 4),
               ('meal_days', '4 gün öğünlerini eksiksiz ver', 4),
               ('photo_count', '1 fotoğraf ekle ya da paylaş', 1))
    select json_agg(json_build_object('key', key, 'label', label, 'target', target,
                    'progress', least(pet_metric(p_pet, key, v_from, v_to), target))), bool_and(pet_metric(p_pet, key, v_from, v_to) >= target)
      into v_goals, v_done from g;
    v_perk := case when extract(week from p_week)::int % 2 = 0 then 'frame_neon' else 'frame_metal' end;
    select name into v_perk_name from vip_perks where perk_key = v_perk;
    return json_build_object('week_start', p_week, 'goals', v_goals, 'ready', v_done,
        'opened', exists (select 1 from pet_week_chests where pet_id = p_pet and week_start = p_week),
        'days_left', greatest((p_week + 6) - qc_day(), 0),
        'shared', not v_open,
        'reward', json_build_object('pawcoin', case when v_open then 100 else 0 end, 'xp', 100,
                                    'perk_key', case when v_open then v_perk end,
                                    'perk_name', case when v_open then coalesce(v_perk_name, 'Özel çerçeve (3 gün)') end));
end $$;

create or replace function public.quest_open_chest(p_pet uuid, p_week date default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid(); v_cur date := qc_week_start(qc_day()); v_week date := coalesce(p_week, qc_week_start(qc_day()));
    v_state json; v_grant json; v_perk text; v_exp timestamptz;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = v_uid) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    if not (v_week = v_cur or (v_week = v_cur - 7 and qc_day() <= v_cur + 1)) then raise exception 'Bu haftanın sandığı artık açılamaz'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_pet::text || ':chest', 0));
    v_state := qc_week_state(p_pet, v_week);
    if (v_state->>'opened')::boolean then raise exception 'Bu sandık zaten açıldı'; end if;
    if not (v_state->>'ready')::boolean then raise exception 'Haftanın hedefleri henüz tamamlanmadı'; end if;

    insert into pet_week_chests (pet_id, week_start) values (p_pet, v_week);
    v_grant := quest_grant(v_uid, p_pet, 'chest:' || p_pet || ':' || v_week, 'Haftalık sandık', 100, 100);
    -- Çerçeve hakkı da hesap başına: haftanın ilk sandığıyla gelir
    if not coalesce((v_grant->>'shared')::boolean, false) then
        v_perk := v_state->'reward'->>'perk_key';
        insert into user_active_perks (user_id, perk_key, expires_at) values (v_uid, v_perk, now() + interval '72 hours')
        on conflict (user_id, perk_key) do update set expires_at = greatest(user_active_perks.expires_at, now()) + interval '72 hours', updated_at = now()
        returning expires_at into v_exp;
    end if;
    return json_build_object('pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int,
        'perk_name', case when v_perk is not null then v_state->'reward'->>'perk_name' end, 'perk_expires_at', v_exp);
end $$;

create or replace function public.quest_badges(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_vals jsonb := '{}'::jsonb; r record; v_list jsonb := '[]'::jsonb; v_cur numeric; v_uid uuid := auth.uid();
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = v_uid) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    perform qc_badge_sync(p_pet);
    for r in select b.*, pb.earned_at, coalesce(pb.featured, false) featured from badge_defs b
               left join pet_badges pb on pb.pet_id = p_pet and pb.badge_key = b.key
              where pb.badge_key is not null or b.family not in ('adventure', 'program')
              order by b.category, b.sort loop
        v_cur := null;
        if r.metric not like '%:%' then
            if not v_vals ? r.metric then v_vals := v_vals || jsonb_build_object(r.metric, pet_metric(p_pet, r.metric, '-infinity', 'infinity')); end if;
            v_cur := (v_vals->>r.metric)::numeric;
        end if;
        v_list := v_list || jsonb_build_object('key', r.key, 'family', r.family, 'tier', r.tier, 'category', r.category,
            'title', case when r.hidden and r.earned_at is null then 'Gizli rozet' else r.title end,
            'description', case when r.hidden and r.earned_at is null then 'Keşfetmen gereken bir rozet' else r.description end,
            'icon', case when r.hidden and r.earned_at is null then '❔' else r.icon end,
            'threshold', r.threshold, 'unit', r.unit, 'current', case when r.hidden and r.earned_at is null then null else least(v_cur, r.threshold) end,
            'pawcoin', case when qc_coin_open(v_uid, 'badge:' || p_pet || ':' || r.key) then r.pawcoin else 0 end,
            'xp', r.xp, 'earned_at', r.earned_at, 'featured', r.featured, 'hidden', r.hidden);
    end loop;
    return json_build_object('badges', v_list, 'earned', (select count(*) from pet_badges where pet_id = p_pet));
end $$;

create or replace function public.qc_adventure(p_pet uuid, p_grant boolean)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_owner uuid; v_sp text := pet_species(p_pet);
    v_month_start date := date_trunc('month', qc_day())::date;
    v_month text := to_char(qc_day(), 'YYYY-MM');
    v_from timestamptz := qc_ts(date_trunc('month', qc_day())::date);
    v_to timestamptz := qc_ts((date_trunc('month', qc_day()) + interval '1 month')::date);
    a adventures; st jsonb; g jsonb; v_goal jsonb; v_metric text; v_target numeric; v_prog numeric;
    v_stages jsonb := '[]'::jsonb; v_goals jsonb; v_stage_done boolean; v_prev_done boolean := true; v_claimed boolean;
    v_awarded jsonb := '[]'::jsonb; v_grant json; v_all boolean := true; v_current int := null; i int; v_badge record; v_ref text;
begin
    select owner_id into v_owner from pets where id = p_pet;
    select * into a from adventures where month = v_month and published;
    if not found then return null; end if;

    for i in 0 .. jsonb_array_length(a.stages) - 1 loop
        st := a.stages -> i;
        v_goals := '[]'::jsonb; v_stage_done := v_prev_done;
        for g in select * from jsonb_array_elements(st -> 'goals') loop
            v_goal := case when v_sp <> 'dog' and g ? 'alt' then g -> 'alt' else g end;
            v_metric := v_goal ->> 'metric'; v_target := (v_goal ->> 'target')::numeric;
            v_prog := least(pet_metric(p_pet, v_metric, v_from, v_to), v_target);
            if v_prog < v_target then v_stage_done := false; end if;
            v_goals := v_goals || jsonb_build_object('label', v_goal ->> 'label', 'progress', round(v_prog, 1), 'target', v_target);
        end loop;
        v_ref := 'adv:' || p_pet || ':' || v_month || ':' || i;
        v_claimed := exists (select 1 from quest_rewards where user_id = v_owner and ref = v_ref);
        if p_grant and v_stage_done and not v_claimed then
            v_grant := quest_grant(v_owner, p_pet, v_ref, a.title || ': ' || (st ->> 'title'),
                                   coalesce((st ->> 'pawcoin')::int, 50), coalesce((st ->> 'xp')::int, 100));
            v_claimed := true;
            v_awarded := v_awarded || jsonb_build_object('label', st ->> 'title', 'pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int);
        end if;
        if not v_stage_done then v_all := false; if v_current is null then v_current := i; end if; end if;
        v_stages := v_stages || jsonb_build_object('index', i, 'title', st ->> 'title', 'story', st ->> 'story', 'emoji', st ->> 'emoji',
            'pawcoin', case when qc_coin_open(v_owner, v_ref) then coalesce((st ->> 'pawcoin')::int, 50) else 0 end,
            'xp', coalesce((st ->> 'xp')::int, 100),
            'unlocked', v_prev_done, 'done', v_stage_done, 'claimed', v_claimed, 'goals', v_goals);
        v_prev_done := v_stage_done;
    end loop;

    if v_all and p_grant then
        insert into pet_badges (pet_id, badge_key) values (p_pet, a.badge_key) on conflict do nothing;
        v_grant := quest_grant(v_owner, p_pet, 'advfinal:' || p_pet || ':' || v_month, a.title || ' tamamlandı', a.final_pawcoin, a.final_xp);
        if (v_grant->>'granted')::boolean then
            v_awarded := v_awarded || jsonb_build_object('label', a.title, 'pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int);
        end if;
    end if;
    select title, icon into v_badge from badge_defs where key = a.badge_key;

    return json_build_object('month', v_month, 'title', a.title, 'subtitle', a.subtitle, 'story', a.story, 'emoji', a.emoji, 'tint', a.tint,
        'days_left', (v_month_start + interval '1 month')::date - qc_day(),
        'badge', json_build_object('key', a.badge_key, 'title', v_badge.title, 'icon', v_badge.icon,
                                   'earned', exists (select 1 from pet_badges where pet_id = p_pet and badge_key = a.badge_key)),
        'final_pawcoin', case when qc_coin_open(v_owner, 'advfinal:' || p_pet || ':' || v_month) then a.final_pawcoin else 0 end,
        'current_stage', coalesce(v_current, jsonb_array_length(a.stages)), 'completed', v_all,
        'stages', v_stages, 'awarded', v_awarded,
        'month_pawcoin', (select coalesce(sum(pawcoin), 0) from quest_rewards where user_id = v_owner and pet_id = p_pet and created_at >= v_from and created_at < v_to),
        'month_badges', (select coalesce(json_agg(json_build_object('key', b.key, 'title', b.title, 'icon', b.icon) order by pb.earned_at), '[]'::json)
                           from pet_badges pb join badge_defs b on b.key = pb.badge_key
                          where pb.pet_id = p_pet and pb.earned_at >= v_from and pb.earned_at < v_to));
end $$;

create or replace function public.programs_list(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_sp text; v_uid uuid := auth.uid();
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = v_uid) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    v_sp := pet_species(p_pet);
    return (select coalesce(json_agg(json_build_object('key', p.key, 'title', p.title, 'subtitle', p.subtitle, 'description', p.description,
                'tags', p.tags, 'emoji', p.emoji, 'tint', p.tint, 'days', jsonb_array_length(p.steps),
                'pawcoin', case when qc_coin_open(v_uid, 'program:' || p_pet || ':' || p.key) then p.pawcoin else 0 end, 'xp', p.xp,
                'badge', (select json_build_object('title', b.title, 'icon', b.icon) from badge_defs b where b.key = p.badge_key),
                'status', pp.status, 'steps_done', coalesce(pp.steps_done, 0), 'for_you', p.species is not null)
                order by (pp.status = 'active') desc nulls last, p.sort), '[]'::json)
              from programs p left join pet_programs pp on pp.pet_id = p_pet and pp.program_key = p.key
             where p.published and (p.species is null or v_sp = any(p.species)));
end $$;

create or replace function public.program_view(p_pet uuid, p_key text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare p programs; pp pet_programs; v_steps jsonb := '[]'::jsonb; i int; v_uid uuid := auth.uid();
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = v_uid) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    select * into p from programs where key = p_key and published;
    if not found then raise exception 'Program bulunamadı'; end if;
    select * into pp from pet_programs where pet_id = p_pet and program_key = p_key;
    for i in 0 .. jsonb_array_length(p.steps) - 1 loop
        v_steps := v_steps || jsonb_build_object('index', i, 'title', p.steps -> i ->> 'title', 'body', p.steps -> i ->> 'body', 'tip', p.steps -> i ->> 'tip',
            'done', i < coalesce(pp.steps_done, 0), 'current', i = coalesce(pp.steps_done, 0));
    end loop;
    return json_build_object('key', p.key, 'title', p.title, 'subtitle', p.subtitle, 'description', p.description, 'tags', p.tags,
        'emoji', p.emoji, 'tint', p.tint,
        'pawcoin', case when qc_coin_open(v_uid, 'program:' || p_pet || ':' || p.key) then p.pawcoin else 0 end, 'xp', p.xp, 'vet_reviewed', p.vet_reviewed,
        'badge', (select json_build_object('title', b.title, 'icon', b.icon) from badge_defs b where b.key = p.badge_key),
        'status', pp.status, 'steps_done', coalesce(pp.steps_done, 0), 'total', jsonb_array_length(p.steps),
        'today_done', pp.last_step_on = qc_day(),
        'other_active', (select json_build_object('key', x.program_key, 'title', y.title) from pet_programs x join programs y on y.key = x.program_key
                          where x.pet_id = p_pet and x.status = 'active' and x.program_key <> p_key limit 1),
        'steps', v_steps);
end $$;

create or replace function public.quest_center(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid(); v_day date := qc_day(); v_week date := qc_week_start(qc_day());
    v_pet record; r record; v_prog numeric; v_grant json;
    v_awarded jsonb := '[]'::jsonb; v_quests jsonb := '[]'::jsonb; v_done int := 0; v_total int := 0; v_rerolled boolean;
    v_days jsonb := '[]'::jsonb; v_d date; v_streak int := 0; w date; v_adv json; v_badges json; v_prog_row record;
    v_next json; v_lesson json; v_balance int; v_day_bonus boolean; v_xp int; v_bonus_open boolean;
begin
    select id, name, type, avatar_url, coalesce(xp, 0) xp into v_pet from pets where id = p_pet and owner_id = v_uid;
    if not found then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_pet::text || ':qc', 0));

    perform qc_ensure_day(p_pet, v_day);

    -- İlerleme ve tamamlanma (sunucu karar verir)
    for r in select q.*, d.title, d.pawcoin, d.xp from pet_daily_quests q join quest_defs d on d.key = q.quest_key
              where q.pet_id = p_pet and q.day = v_day and q.completed_at is null loop
        v_prog := qc_quest_progress(p_pet, r.quest_key, v_day, r.baseline, r.created_at);
        if v_prog >= r.target then
            update pet_daily_quests set progress = v_prog, completed_at = now() where pet_id = p_pet and day = v_day and quest_key = r.quest_key;
            v_grant := quest_grant(v_uid, p_pet, 'dq:' || p_pet || ':' || v_day || ':' || r.quest_key, r.title, r.pawcoin, r.xp);
            if (v_grant->>'granted')::boolean then
                v_awarded := v_awarded || jsonb_build_object('kind', 'quest', 'key', r.quest_key, 'label', r.title,
                                                             'pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int);
            end if;
        elsif v_prog <> r.progress then
            update pet_daily_quests set progress = v_prog where pet_id = p_pet and day = v_day and quest_key = r.quest_key;
        end if;
    end loop;

    select count(*) filter (where completed_at is not null), count(*), bool_or(rerolled) into v_done, v_total, v_rerolled
      from pet_daily_quests where pet_id = p_pet and day = v_day;
    if v_total > 0 and v_done = v_total then
        v_grant := quest_grant(v_uid, p_pet, 'dqall:' || p_pet || ':' || v_day, 'Günün tüm görevleri', 10, 30);
        if (v_grant->>'granted')::boolean then
            v_awarded := v_awarded || jsonb_build_object('kind', 'day', 'label', 'Günün tüm görevleri', 'pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int);
        end if;
    end if;
    v_day_bonus := exists (select 1 from quest_rewards where user_id = v_uid and ref = 'dqall:' || p_pet || ':' || v_day);
    v_bonus_open := qc_coin_open(v_uid, 'dqall:' || p_pet || ':' || v_day);

    -- pawcoin: bu hayvanda alınabilecek PawCoin (başka hayvanla bugün alındıysa 0, coin_shared = true)
    select coalesce(jsonb_agg(jsonb_build_object('key', q.quest_key, 'title', d.title, 'description', d.description, 'why', d.why, 'how', d.how,
            'icon', d.icon, 'category', d.category, 'unit', d.unit, 'target', q.target, 'progress', least(q.progress, q.target),
            'completed', q.completed_at is not null, 'pawcoin', case when c.open then d.pawcoin else 0 end, 'coin_shared', not c.open,
            'xp', d.xp, 'route', d.route, 'self_report', d.self_report,
            'scope', d.scope, 'can_reroll', d.scope = 'pool' and q.completed_at is null and not coalesce(v_rerolled, false),
            'history', qc_quest_history(p_pet, q.quest_key, v_day))
            order by d.scope, d.sort), '[]'::jsonb)
      into v_quests from pet_daily_quests q join quest_defs d on d.key = q.quest_key
      cross join lateral (select qc_coin_open(v_uid, 'dq:' || p_pet || ':' || v_day || ':' || q.quest_key) open) c
     where q.pet_id = p_pet and q.day = v_day;

    -- Haftanın günleri
    for v_d in select generate_series(v_week, v_week + 6, interval '1 day')::date loop
        v_days := v_days || jsonb_build_object('date', v_d,
            'done', (select count(*) from pet_daily_quests where pet_id = p_pet and day = v_d and completed_at is not null),
            'total', (select count(*) from pet_daily_quests where pet_id = p_pet and day = v_d));
    end loop;

    -- Haftalık seri: sandığı açılan ardışık haftalar (bu hafta açıldıysa bu haftadan, yoksa geçen haftadan geriye)
    w := case when exists (select 1 from pet_week_chests where pet_id = p_pet and week_start = v_week) then v_week else v_week - 7 end;
    while exists (select 1 from pet_week_chests where pet_id = p_pet and week_start = w) loop v_streak := v_streak + 1; w := w - 7; end loop;

    v_badges := qc_badge_sync(p_pet);
    v_adv := qc_adventure(p_pet, true);
    if v_adv is not null and json_array_length(v_adv->'awarded') > 0 then
        v_awarded := v_awarded || (select coalesce(jsonb_agg(x || '{"kind":"adventure"}'::jsonb), '[]'::jsonb) from jsonb_array_elements((v_adv->'awarded')::jsonb) x);
    end if;

    select pp.program_key, p.title, p.emoji, pp.steps_done, jsonb_array_length(p.steps) total, pp.last_step_on into v_prog_row
      from pet_programs pp join programs p on p.key = pp.program_key where pp.pet_id = p_pet and pp.status = 'active' limit 1;

    -- Sıradaki rozet: en yakın, gizli olmayan, kazanılmamış
    select json_build_object('key', b.key, 'title', b.title, 'icon', b.icon, 'current', least(m.v, b.threshold), 'target', b.threshold, 'unit', b.unit)
      into v_next
      from badge_defs b
      cross join lateral (select pet_metric(p_pet, b.metric, '-infinity', 'infinity') v) m
     where not b.hidden and b.metric not like '%:%' and b.family not in ('adventure', 'program')
       and not exists (select 1 from pet_badges pb where pb.pet_id = p_pet and pb.badge_key = b.key)
       and (pet_species(p_pet) = 'dog' or b.category <> 'yuruyus')
     order by m.v / b.threshold desc, b.sort limit 1;

    v_lesson := (lessons_feed(p_pet))->'today';
    select coalesce(pati_puan_balance, 0) into v_balance from profiles where id = v_uid;
    select coalesce(xp, 0) into v_xp from pets where id = p_pet;

    return json_build_object(
        'pet', json_build_object('id', v_pet.id, 'name', v_pet.name, 'species', pet_species(p_pet), 'avatar_url', v_pet.avatar_url,
                                 'level', pet_level_info(v_xp)),
        'balance', v_balance,
        'today_pawcoin', (select coalesce(sum(pawcoin), 0) from quest_rewards where user_id = v_uid and created_at >= qc_ts(v_day)),
        'day', v_day, 'quests', v_quests, 'done', v_done, 'total', v_total,
        'day_bonus', json_build_object('earned', v_day_bonus, 'pawcoin', case when v_bonus_open then 10 else 0 end, 'xp', 30),
        'week', json_build_object('days', v_days, 'chest', qc_week_state(p_pet, v_week), 'streak_weeks', v_streak),
        'adventure', case when v_adv is null then null else json_build_object('month', v_adv->'month', 'title', v_adv->'title', 'emoji', v_adv->'emoji',
                        'days_left', v_adv->'days_left', 'current_stage', v_adv->'current_stage', 'stages', json_array_length(v_adv->'stages'),
                        'completed', v_adv->'completed') end,
        'program', case when v_prog_row.program_key is null then null else json_build_object('key', v_prog_row.program_key, 'title', v_prog_row.title,
                        'emoji', v_prog_row.emoji, 'steps_done', v_prog_row.steps_done, 'total', v_prog_row.total,
                        'today_done', v_prog_row.last_step_on = v_day) end,
        'next_badge', v_next, 'lesson', v_lesson,
        'awarded', v_awarded, 'new_badges', v_badges);
end $$;

-- ── 3. Birlikte: ortak hedef ─────────────────────────────────────────────────
-- Üyenin katkısı katıldığı andan sonrası; bakım günü hesap başına (hayvan sayısıyla çarpılmaz).
create or replace function public.team_member_amount(p_kind text, p_user uuid, p_from timestamptz, p_to timestamptz)
returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare v numeric := 0; v_from_d date := (p_from at time zone 'Europe/Istanbul')::date; v_to_d date := (p_to at time zone 'Europe/Istanbul')::date;
begin
    if p_kind = 'walk_km' then
        select coalesce(sum(distance_meters), 0) / 1000.0 into v from walk_sessions
         where user_id = p_user and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_kind = 'walk_days' then
        select count(distinct (start_time at time zone 'Europe/Istanbul')::date) into v from walk_sessions
         where user_id = p_user and status = 'completed' and start_time >= p_from and start_time < p_to
           and (distance_meters >= 300 or active_seconds >= 600);
    elsif p_kind = 'care_days' then
        -- Gün: hayvanlarından en az birinin öğünü ve suyu tam. Katılma günü, bakım katıldıktan sonra tamamlandıysa sayılır.
        select count(distinct s.date) into v from pet_daily_stats s join pets p on p.id = s.pet_id
         where p.owner_id = p_user and s.date >= v_from_d and s.date <= v_to_d
           and s.meals_given >= pet_meals_target(s.pet_id) and s.water_refreshed_at is not null
           and (s.date > v_from_d or s.updated_at >= p_from);
    elsif p_kind = 'lessons' then
        select count(*) into v from lesson_reads where user_id = p_user and read_at >= p_from and read_at < p_to;
    end if;
    return coalesce(v, 0);
end $$;

create or replace function public.team_goal_create(p_title text, p_kind text, p_target numeric, p_days integer, p_members uuid[])
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_m uuid; v_name text; v_members uuid[]; v_n int;
    v_max numeric := case p_kind when 'walk_km' then 1000 else 300 end;
    v_min numeric := case p_kind when 'walk_km' then 5 else 3 end;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    if char_length(trim(coalesce(p_title, ''))) not between 3 and 60 then raise exception 'Hedef adı 3–60 karakter olmalı'; end if;
    if p_kind not in ('walk_km', 'walk_days', 'care_days', 'lessons') then raise exception 'Geçersiz hedef türü'; end if;
    if p_days is null or p_days not between 3 and 30 then raise exception 'Süre 3 ile 30 gün arasında olmalı'; end if;
    if p_target is null or p_target > v_max then raise exception 'Hedef değeri geçerli değil'; end if;
    if p_target < v_min then
        raise exception 'Hedef en az % % olmalı', v_min, case p_kind when 'walk_km' then 'km' when 'lessons' then 'bilgi kartı' else 'gün' end;
    end if;
    select array_agg(distinct m) into v_members from unnest(coalesce(p_members, '{}')) m where m is not null and m <> v_uid;
    v_n := coalesce(array_length(v_members, 1), 0);
    if v_n not between 1 and 4 then raise exception 'En az 1, en çok 4 arkadaş davet et'; end if;
    if p_kind in ('walk_days', 'care_days') and p_target > p_days * (v_n + 1) then
        raise exception 'Bu hedef bu sürede ulaşılamaz: en çok % gün olabilir', p_days * (v_n + 1);
    end if;
    foreach v_m in array v_members loop
        if not exists (select 1 from follows a join follows b on b.follower_id = a.following_id and b.following_id = a.follower_id
                        where a.follower_id = v_uid and a.following_id = v_m) then
            raise exception 'Yalnızca karşılıklı takipleştiğin kişileri davet edebilirsin';
        end if;
    end loop;
    if (select count(*) from team_goal_members m join team_goals g on g.id = m.goal_id
         where m.user_id = v_uid and m.status = 'accepted' and g.status = 'active') >= 5 then
        raise exception 'Aynı anda en çok 5 ortak hedefte olabilirsin';
    end if;

    insert into team_goals (creator_id, title, kind, target, ends_at) values (v_uid, trim(p_title), p_kind, p_target, now() + make_interval(days => p_days))
    returning id into v_id;
    insert into team_goal_members (goal_id, user_id, status, joined_at) values (v_id, v_uid, 'accepted', now());
    insert into team_goal_members (goal_id, user_id) select v_id, unnest(v_members);

    select coalesce(full_name, username, 'Bir arkadaşın') into v_name from profiles where id = v_uid;
    foreach v_m in array v_members loop
        perform notify_user(v_m, 'team_invite', 'Birlikte hedef daveti', v_name || ' seni "' || trim(p_title) || '" hedefine davet etti', v_uid, v_id::text);
    end loop;
    return v_id;
end $$;

-- Birlikte ödülleri (ortak hedef + düello) haftada en çok 120 PawCoin; kalan haftanın hakkı.
create or replace function public.qc_social_coin_left(p_user uuid) returns integer
language sql stable security definer set search_path to 'public' as $$
    select greatest(120 - coalesce(sum(pawcoin), 0), 0)::int from quest_rewards
     where user_id = p_user and (ref like 'team:%' or ref like 'duel:%') and created_at >= qc_ts(qc_week_start(qc_day()))
$$;

create or replace function public.team_goals_view()
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid(); g record; m record; v_total numeric; v_members jsonb; v_goals jsonb := '[]'::jsonb; v_invites jsonb := '[]'::jsonb;
    v_amount numeric; v_pet uuid; v_duels json; v_accepted int;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    for g in select tg.*, me.status my_status from team_goals tg join team_goal_members me on me.goal_id = tg.id and me.user_id = v_uid
              where me.status in ('invited', 'accepted')
                and (tg.status = 'active' or (tg.status in ('completed', 'expired') and coalesce(tg.completed_at, tg.ends_at) > now() - interval '14 days'))
              order by tg.status = 'active' desc, tg.ends_at loop
        perform pg_advisory_xact_lock(hashtextextended(g.id::text || ':team', 0));
        v_total := 0; v_members := '[]'::jsonb; v_accepted := 0;
        for m in select tm.user_id, tm.status, tm.joined_at, c.full_name, c.username, c.avatar_url from team_goal_members tm
                   left join profile_cards c on c.id = tm.user_id
                  where tm.goal_id = g.id and tm.status in ('invited', 'accepted') order by tm.status, c.full_name loop
            v_amount := case when m.status = 'accepted'
                             then team_member_amount(g.kind, m.user_id, greatest(g.starts_at, coalesce(m.joined_at, g.starts_at)), least(g.ends_at, now()))
                             else 0 end;
            if m.status = 'accepted' then v_accepted := v_accepted + 1; end if;
            v_total := v_total + v_amount;
            v_members := v_members || jsonb_build_object('id', m.user_id, 'name', coalesce(m.full_name, m.username), 'avatar_url', m.avatar_url,
                                                         'status', m.status, 'amount', round(v_amount, 1), 'me', m.user_id = v_uid);
        end loop;

        -- "Birlikte": en az iki kabul eden üye olmadan tamamlanmaz
        if g.status = 'active' and v_total >= g.target and v_accepted >= 2 then
            update team_goals set status = 'completed', completed_at = now() where id = g.id and status = 'active';
            g.status := 'completed';
        elsif g.status = 'active' and now() > g.ends_at then
            update team_goals set status = 'expired' where id = g.id and status = 'active';
            g.status := 'expired';
        end if;
        -- Tamamlanan hedefin ödülü her üyeye kendi açtığında (XP en eski hayvanına)
        if g.status = 'completed' and g.my_status = 'accepted' then
            select id into v_pet from pets where owner_id = v_uid order by created_at limit 1;
            perform quest_grant(v_uid, v_pet, 'team:' || g.id, 'Birlikte: ' || g.title, least(50, qc_social_coin_left(v_uid)), 100);
        end if;

        if g.my_status = 'invited' then
            v_invites := v_invites || jsonb_build_object('id', g.id, 'title', g.title, 'kind', g.kind, 'target', g.target, 'ends_at', g.ends_at,
                'creator', (select coalesce(full_name, username) from profile_cards where id = g.creator_id), 'members', v_members);
        else
            v_goals := v_goals || jsonb_build_object('id', g.id, 'title', g.title, 'kind', g.kind, 'target', g.target, 'total', round(v_total, 1),
                'status', g.status, 'starts_at', g.starts_at, 'ends_at', g.ends_at, 'accepted', v_accepted,
                'days_left', greatest(ceil(extract(epoch from (g.ends_at - now())) / 86400), 0), 'members', v_members,
                'is_creator', g.creator_id = v_uid,
                'reward', json_build_object('pawcoin', coalesce((select pawcoin from quest_rewards where user_id = v_uid and ref = 'team:' || g.id), 50), 'xp', 100));
        end if;
    end loop;

    -- Düellolar (var olan sistem: social_challenges)
    select coalesce(json_agg(json_build_object('id', s.id, 'status', s.status, 'starts_at', s.starts_at, 'ends_at', s.ends_at,
                'duration_days', s.duration_days, 'winner_id', s.winner_id, 'i_am_creator', s.creator_id = v_uid,
                'my_reward', (select pawcoin from quest_rewards where user_id = v_uid and ref = 'duel:' || s.id),
                'opponent', (select json_build_object('id', c.id, 'name', coalesce(c.full_name, c.username), 'avatar_url', c.avatar_url)
                               from profile_cards c where c.id = case when s.creator_id = v_uid then s.partner_id else s.creator_id end),
                'my_km', round(case when s.status in ('active', 'completed') then team_member_amount('walk_km', v_uid, s.starts_at, least(coalesce(s.ends_at, now()), now())) else 0 end, 2),
                'their_km', round(case when s.status in ('active', 'completed') then team_member_amount('walk_km',
                                  case when s.creator_id = v_uid then s.partner_id else s.creator_id end, s.starts_at, least(coalesce(s.ends_at, now()), now())) else 0 end, 2))
                order by s.created_at desc), '[]'::json)
      into v_duels from social_challenges s
     where s.mode = 'duel' and (s.creator_id = v_uid or s.partner_id = v_uid)
       and (s.status in ('pending', 'active') or s.created_at > now() - interval '14 days');

    return json_build_object('goals', v_goals, 'invites', v_invites, 'duels', v_duels, 'social_coin_left', qc_social_coin_left(v_uid));
end $$;

-- ── 2. Düello ───────────────────────────────────────────────────────────────
create or replace function public.create_social_challenge(p_partner_id uuid, p_mode text, p_duration_days integer, p_target_km numeric default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_user_id uuid := auth.uid(); v_id uuid; v_name text;
begin
    if v_user_id is null then raise exception 'Giriş gerekli'; end if;
    if v_user_id = p_partner_id then raise exception 'Kendini düelloya davet edemezsin'; end if;
    -- Ortak "takım" hedefleri artık Birlikte > ortak hedef (team_goals) ile
    if p_mode is distinct from 'duel' then raise exception 'Ortak hedef için "Arkadaş görevi oluştur"u kullan'; end if;
    if p_duration_days is null or p_duration_days not in (1, 3, 7) then raise exception 'Süre 1, 3 ya da 7 gün olmalı'; end if;
    if not exists (select 1 from follows a join follows b on a.follower_id = b.following_id and a.following_id = b.follower_id
                    where a.follower_id = v_user_id and a.following_id = p_partner_id) then
        raise exception 'Sadece karşılıklı takipleştiğin kişileri davet edebilirsin';
    end if;
    if exists (select 1 from social_challenges where status in ('pending', 'active')
                and ((creator_id = v_user_id and partner_id = p_partner_id) or (creator_id = p_partner_id and partner_id = v_user_id))) then
        raise exception 'Bu kişiyle zaten bekleyen ya da süren bir düellon var';
    end if;
    if (select count(*) from social_challenges where status in ('pending', 'active') and (creator_id = v_user_id or partner_id = v_user_id)) >= 3 then
        raise exception 'Aynı anda en çok 3 düello olabilir';
    end if;

    insert into social_challenges (mode, creator_id, partner_id, duration_days, target_km, reward_pp)
    values ('duel', v_user_id, p_partner_id, p_duration_days, null, 30)
    returning id into v_id;

    select coalesce(full_name, username, 'Bir Moffi kullanıcısı') into v_name from profiles where id = v_user_id;
    insert into notifications (user_id, type, title, content, is_read, actor_id, entity_id)
    values (p_partner_id, 'challenge_invite', '⚔️ Düello daveti', v_name || ' seni bir yürüyüş düellosuna davet etti', false, v_user_id, v_id::text);
    return v_id;
end $$;

-- Sonuç: en az 1 km yürüyen tarafa 30 PawCoin, kazanana (o da en az 1 km) +30. Ödül quest_grant'tan (defter, günlük tavan,
-- haftalık Birlikte tavanı). Eski bekleyen "takım" kayıtları: toplam hedef tutarsa en az 1 km yürüyen tarafa 30.
create or replace function public.finalize_social_challenge(p_challenge_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
    v_user_id uuid := auth.uid(); c record; v_ckm numeric; v_pkm numeric; v_cname text; v_pname text; v_winner uuid; v_success boolean;
begin
    select * into c from social_challenges where id = p_challenge_id;
    if c.id is null or (c.creator_id <> v_user_id and c.partner_id <> v_user_id) then raise exception 'Bu düelloya erişimin yok'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_challenge_id::text || ':duel', 0));
    select * into c from social_challenges where id = p_challenge_id;
    if c.status <> 'active' then return; end if;
    if now() < c.ends_at then raise exception 'Bu düello henüz bitmedi'; end if;

    v_ckm := team_member_amount('walk_km', c.creator_id, c.starts_at, c.ends_at);
    v_pkm := team_member_amount('walk_km', c.partner_id, c.starts_at, c.ends_at);
    select coalesce(full_name, username, 'Rakibin') into v_cname from profiles where id = c.creator_id;
    select coalesce(full_name, username, 'Rakibin') into v_pname from profiles where id = c.partner_id;

    if c.mode = 'duel' then
        v_winner := case when v_ckm > v_pkm and v_ckm >= 1 then c.creator_id when v_pkm > v_ckm and v_pkm >= 1 then c.partner_id end;
        update social_challenges set status = 'completed', winner_id = v_winner where id = p_challenge_id;
        if v_ckm >= 1 then
            perform quest_grant(c.creator_id, null, 'duel:' || c.id, 'Düello: ' || v_pname || ' ile',
                                least(30 + case when v_winner = c.creator_id then 30 else 0 end, qc_social_coin_left(c.creator_id)), 0);
        end if;
        if v_pkm >= 1 then
            perform quest_grant(c.partner_id, null, 'duel:' || c.id, 'Düello: ' || v_cname || ' ile',
                                least(30 + case when v_winner = c.partner_id then 30 else 0 end, qc_social_coin_left(c.partner_id)), 0);
        end if;
    else
        v_success := (v_ckm + v_pkm) >= coalesce(c.target_km, 0) and coalesce(c.target_km, 0) >= 5;
        update social_challenges set status = 'completed' where id = p_challenge_id;
        if v_success and v_ckm >= 1 then
            perform quest_grant(c.creator_id, null, 'duel:' || c.id, 'Takım görevi: ' || v_pname || ' ile', least(30, qc_social_coin_left(c.creator_id)), 0);
        end if;
        if v_success and v_pkm >= 1 then
            perform quest_grant(c.partner_id, null, 'duel:' || c.id, 'Takım görevi: ' || v_cname || ' ile', least(30, qc_social_coin_left(c.partner_id)), 0);
        end if;
    end if;

    insert into notifications (user_id, type, title, content, is_read, actor_id, entity_id) values
        (c.creator_id, 'challenge_finished', '🏁 Düello bitti', 'Sonucu görmek için dokun.', false, c.partner_id, p_challenge_id::text),
        (c.partner_id, 'challenge_finished', '🏁 Düello bitti', 'Sonucu görmek için dokun.', false, c.creator_id, p_challenge_id::text);
end $$;

-- ── 6. Hesap başına en çok 10 hayvan ─────────────────────────────────────────
create or replace function public.pets_limit_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
    if tg_op = 'UPDATE' and new.owner_id is not distinct from old.owner_id then return new; end if;
    if (select count(*) from pets where owner_id = new.owner_id and id <> new.id) >= 10 then
        raise exception 'Bir hesapta en çok 10 hayvan olabilir' using errcode = 'P0001';
    end if;
    return new;
end $$;
revoke execute on function public.pets_limit_guard() from public, anon, authenticated;
create or replace trigger pets_limit_guard before insert or update of owner_id on public.pets for each row execute function public.pets_limit_guard();

-- ── Yetkiler ────────────────────────────────────────────────────────────────
revoke execute on function public.qc_coin_ref(text), public.qc_coin_open(uuid, text), public.qc_social_coin_left(uuid) from public, anon, authenticated;
revoke execute on function public.quest_grant(uuid, uuid, text, text, integer, integer), public.pet_metric(uuid, text, timestamptz, timestamptz),
    public.qc_pool_eligible(uuid), public.qc_week_state(uuid, date), public.qc_adventure(uuid, boolean),
    public.team_member_amount(text, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.quest_open_chest(uuid, date), public.quest_badges(uuid), public.programs_list(uuid), public.program_view(uuid, text),
    public.quest_center(uuid), public.team_goal_create(text, text, numeric, integer, uuid[]), public.team_goals_view(),
    public.create_social_challenge(uuid, text, integer, numeric), public.finalize_social_challenge(uuid) from public, anon;
grant execute on function public.quest_open_chest(uuid, date), public.quest_badges(uuid), public.programs_list(uuid), public.program_view(uuid, text),
    public.quest_center(uuid), public.team_goal_create(text, text, numeric, integer, uuid[]), public.team_goals_view(),
    public.create_social_challenge(uuid, text, integer, numeric), public.finalize_social_challenge(uuid) to authenticated;
