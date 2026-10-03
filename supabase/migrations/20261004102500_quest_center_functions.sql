-- Görev Merkezi v2 — sunucu fonksiyonları. Tamamlanma gerçek kayıtlardan ölçülür (pet_metric), ödül quest_grant ile bir kez verilir.
-- İstemcinin çağırdıkları: quest_center, quest_reroll, quest_open_chest, quest_badges, quest_badge_feature, quest_adventure,
-- programs_list, program_view, program_start, program_step_done, program_leave, lessons_feed, lesson_view, lesson_mark_read,
-- team_friend_candidates, team_goal_create, team_goal_respond, team_goal_leave, team_goals_view.

-- ── Zaman ve tür yardımcıları ───────────────────────────────────────────────
create or replace function public.qc_day() returns date
language sql stable set search_path to 'public' as $$ select (now() at time zone 'Europe/Istanbul')::date $$;

create or replace function public.qc_ts(p_day date) returns timestamptz
language sql stable set search_path to 'public' as $$ select p_day::timestamp at time zone 'Europe/Istanbul' $$;

create or replace function public.qc_week_start(p_day date) returns date
language sql immutable set search_path to 'public' as $$ select p_day - (extract(isodow from p_day)::int - 1) $$;

create or replace function public.pet_species(p_pet uuid) returns text
language sql stable security definer set search_path to 'public' as $$
    select case type when 'dog' then 'dog' when 'cat' then 'cat' else 'other' end from pets where id = p_pet
$$;

create or replace function public.pet_passport_missing(p_pet uuid) returns integer
language sql stable security definer set search_path to 'public' as $$
    select (case when nullif(trim(coalesce(breed, '')), '') is null then 1 else 0 end)
         + (case when birth_date is null then 1 else 0 end)
         + (case when nullif(trim(coalesce(gender, '')), '') is null then 1 else 0 end)
         + (case when nullif(trim(coalesce(color, '')), '') is null then 1 else 0 end)
         + (case when nullif(trim(coalesce(microchip_no, '')), '') is null then 1 else 0 end)
         + (case when weight is null then 1 else 0 end)
         + (case when nullif(trim(coalesce(avatar_url, '')), '') is null then 1 else 0 end)
      from pets where id = p_pet
$$;

create or replace function public.pet_emergency_set(p_pet uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
    select exists (select 1 from pet_health_profile
                    where pet_id = p_pet and coalesce(nullif(trim(contact_phone), ''), nullif(trim(alt_contact_phone), '')) is not null)
$$;

-- ── Ölçüm: tek yer. Görev, sandık, rozet, macera hepsi buradan okur. ─────────
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

    if p_metric = 'walk_km' then
        select coalesce(sum(distance_meters), 0) / 1000.0 into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_metric = 'walk_count' then
        select count(*) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_metric = 'walk_days' then
        select count(distinct (start_time at time zone 'Europe/Istanbul')::date) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_metric = 'morning_walks' then
        select count(*) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to
           and extract(hour from start_time at time zone 'Europe/Istanbul') < 7;
    elsif p_metric = 'night_walks' then
        select count(*) into v from walk_sessions
         where pet_id = p_pet::text and status = 'completed' and start_time >= p_from and start_time < p_to
           and extract(hour from start_time at time zone 'Europe/Istanbul') >= 21;
    elsif p_metric = 'regions' then
        -- ~1 km'lik hücreler (2 ondalık); başlangıç noktası farklı hücrede olan yürüyüşler farklı bölge
        select count(*) into v from (
            select distinct round(start_lat::numeric, 2), round(start_lng::numeric, 2) from walk_sessions
             where pet_id = p_pet::text and status = 'completed' and start_lat is not null
               and start_time >= p_from and start_time < p_to) x;
    elsif p_metric = 'new_places' then
        select count(*) into v from (
            select distinct round(start_lat::numeric, 2) a, round(start_lng::numeric, 2) b from walk_sessions
             where pet_id = p_pet::text and status = 'completed' and start_lat is not null and start_time >= p_from and start_time < p_to
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
    elsif p_metric = 'weigh_count' then
        select count(*) into v from pet_weight_logs where pet_id = p_pet and created_at >= p_from and created_at < p_to;
    elsif p_metric = 'vet_visits' then
        select (select count(*) from vaccines where pet_id = p_pet and date_administered >= p_from and date_administered < p_to)
             + (select count(*) from medical_records where pet_id = p_pet and coalesce(visit_date::timestamp at time zone 'Europe/Istanbul', created_at) >= p_from
                                                        and coalesce(visit_date::timestamp at time zone 'Europe/Istanbul', created_at) < p_to)
          into v;
    elsif p_metric = 'photo_count' then
        select (select count(*) from pet_media where pet_id = p_pet and status = 'ready' and created_at >= p_from and created_at < p_to)
             + (select count(*) from posts where p_pet = any(tagged_pet_ids) and status = 'published' and created_at >= p_from and created_at < p_to)
          into v;
    elsif p_metric = 'posts_with_pet' then
        select count(*) into v from posts where p_pet = any(tagged_pet_ids) and status = 'published' and created_at >= p_from and created_at < p_to;
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

-- ── Günlük görev: uygun havuz, üretim, ilerleme ────────────────────────────
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
             when 'passport' then pet_passport_missing(p_pet) > 0
             when 'weigh' then not exists (select 1 from pet_weight_logs w where w.pet_id = p_pet and w.created_at >= now() - interval '7 days')
             when 'learn' then exists (select 1 from lessons l where l.published and (l.species is null or v_sp = any(l.species))
                                         and not exists (select 1 from lesson_reads r where r.user_id = v_owner and r.lesson_id = l.id))
             when 'new_place' then exists (select 1 from walk_sessions w where w.pet_id = p_pet::text and w.status = 'completed' and w.start_lat is not null)
             when 'post_pet' then not exists (select 1 from posts p where p_pet = any(p.tagged_pet_ids) and p.status = 'published' and p.created_at >= now() - interval '7 days')
             else true end;
end $$;

create or replace function public.qc_quest_target(p_pet uuid, p_key text) returns numeric
language sql stable security definer set search_path to 'public' as $$
    select case p_key
             when 'walk' then (select coalesce(walk_goal_km, pet_walk_goal_auto(p_pet)) from pets where id = p_pet)
             when 'meals' then pet_meals_target(p_pet)::numeric
             else 1 end
$$;

create or replace function public.qc_quest_progress(p_pet uuid, p_key text, p_day date, p_baseline numeric, p_created timestamptz)
returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare v_from timestamptz := qc_ts(p_day); v_to timestamptz := qc_ts(p_day + 1); v_owner uuid; v numeric := 0;
begin
    select owner_id into v_owner from pets where id = p_pet;
    case p_key
        when 'walk' then v := round(pet_metric(p_pet, 'walk_km', v_from, v_to), 2);
        when 'play' then select case when played_at is not null then 1 else 0 end into v from pet_daily_stats where pet_id = p_pet and date = p_day;
        when 'meals' then select meals_given into v from pet_daily_stats where pet_id = p_pet and date = p_day;
        when 'water' then select case when water_refreshed_at is not null then 1 else 0 end into v from pet_daily_stats where pet_id = p_pet and date = p_day;
        when 'vaccine_plan' then
            select (select count(*) from appointments where pet_id = p_pet and created_at >= p_created and status not in ('cancelled', 'rejected'))
                 + (select count(*) from vaccines where pet_id = p_pet and created_at >= p_created) into v;
        when 'emergency' then v := case when pet_emergency_set(p_pet) then 1 else 0 end;
        when 'passport' then v := greatest(p_baseline - pet_passport_missing(p_pet), 0);
        when 'weigh' then select count(*) into v from pet_weight_logs where pet_id = p_pet and created_at >= v_from and created_at < v_to;
        when 'learn' then select count(*) into v from lesson_reads where user_id = v_owner and read_at >= v_from and read_at < v_to;
        when 'photo' then v := pet_metric(p_pet, 'photo_count', v_from, v_to);
        when 'new_place' then v := pet_metric(p_pet, 'new_places', v_from, v_to);
        when 'post_pet' then v := pet_metric(p_pet, 'posts_with_pet', v_from, v_to);
        else v := 0;
    end case;
    return coalesce(v, 0);
end $$;

-- Günün görevlerini (yoksa) üretir: tür için çekirdek görevler + havuzdan 2 (biri öncelikli işlerden, biri dönüşümlü).
create or replace function public.qc_ensure_day(p_pet uuid, p_day date)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_sp text := pet_species(p_pet); v_first text; v_second text;
begin
    if exists (select 1 from pet_daily_quests where pet_id = p_pet and day = p_day) then return; end if;

    insert into pet_daily_quests (pet_id, day, quest_key, target)
    select p_pet, p_day, d.key, qc_quest_target(p_pet, d.key) from quest_defs d
     where d.scope = 'core' and d.active and (d.species is null or v_sp = any(d.species));

    select e.key into v_first from qc_pool_eligible(p_pet) e
     order by (e.priority >= 20) desc, case when e.priority >= 20 then e.priority else 0 end desc, md5(p_pet::text || p_day::text || e.key) limit 1;
    select e.key into v_second from qc_pool_eligible(p_pet) e where e.key is distinct from v_first and e.priority < 20
     order by md5(p_day::text || p_pet::text || e.key) limit 1;

    insert into pet_daily_quests (pet_id, day, quest_key, target, baseline)
    select p_pet, p_day, k, qc_quest_target(p_pet, k), case when k = 'passport' then pet_passport_missing(p_pet) else 0 end
      from unnest(array[v_first, v_second]) k where k is not null;
end $$;

-- ── Haftalık sandık ─────────────────────────────────────────────────────────
create or replace function public.qc_week_state(p_pet uuid, p_week date)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare
    v_sp text := pet_species(p_pet);
    v_from timestamptz := qc_ts(p_week); v_to timestamptz := qc_ts(p_week + 7);
    v_goals json; v_done boolean; v_perk text; v_perk_name text;
begin
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
        'reward', json_build_object('pawcoin', 100, 'xp', 100, 'perk_key', v_perk, 'perk_name', coalesce(v_perk_name, 'Özel çerçeve (3 gün)')));
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
    v_perk := v_state->'reward'->>'perk_key';
    insert into user_active_perks (user_id, perk_key, expires_at) values (v_uid, v_perk, now() + interval '72 hours')
    on conflict (user_id, perk_key) do update set expires_at = greatest(user_active_perks.expires_at, now()) + interval '72 hours', updated_at = now()
    returning expires_at into v_exp;
    return json_build_object('pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int,
        'perk_name', v_state->'reward'->>'perk_name', 'perk_expires_at', v_exp);
end $$;

-- ── Rozetler ────────────────────────────────────────────────────────────────
create or replace function public.qc_badge_sync(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_owner uuid; r record; v_vals jsonb := '{}'::jsonb; v_new jsonb := '[]'::jsonb; v_grant json;
begin
    select owner_id into v_owner from pets where id = p_pet;
    for r in select b.* from badge_defs b
              where b.metric in ('walk_count', 'walk_km', 'morning_walks', 'night_walks', 'regions', 'water_days', 'meal_days', 'vet_visits',
                                 'weigh_count', 'lessons', 'programs_done', 'posts_with_pet', 'teams_done', 'chests')
                and not exists (select 1 from pet_badges pb where pb.pet_id = p_pet and pb.badge_key = b.key)
              order by b.sort loop
        if not v_vals ? r.metric then
            v_vals := v_vals || jsonb_build_object(r.metric, pet_metric(p_pet, r.metric, '-infinity', 'infinity'));
        end if;
        if (v_vals->>r.metric)::numeric >= r.threshold then
            insert into pet_badges (pet_id, badge_key) values (p_pet, r.key) on conflict do nothing;
            v_grant := quest_grant(v_owner, p_pet, 'badge:' || p_pet || ':' || r.key, 'Rozet: ' || r.title, r.pawcoin, r.xp);
            v_new := v_new || jsonb_build_object('key', r.key, 'title', r.title, 'icon', r.icon,
                                                 'pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int);
        end if;
    end loop;
    return v_new::json;
end $$;

-- Rozet kasası: tüm rozetler, kazanılanlar, ilerleme (gizli rozet kazanılmadıysa adı gizli)
create or replace function public.quest_badges(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_vals jsonb := '{}'::jsonb; r record; v_list jsonb := '[]'::jsonb; v_earned record; v_cur numeric;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
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
            'pawcoin', r.pawcoin, 'xp', r.xp, 'earned_at', r.earned_at, 'featured', r.featured, 'hidden', r.hidden);
    end loop;
    return json_build_object('badges', v_list, 'earned', (select count(*) from pet_badges where pet_id = p_pet));
end $$;

create or replace function public.quest_badge_feature(p_pet uuid, p_key text, p_on boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    if not exists (select 1 from pet_badges where pet_id = p_pet and badge_key = p_key) then raise exception 'Bu rozet henüz kazanılmadı'; end if;
    if p_on and (select count(*) from pet_badges where pet_id = p_pet and featured and badge_key <> p_key) >= 3 then
        raise exception 'Vitrinde en çok 3 rozet olabilir; önce birini kaldır';
    end if;
    update pet_badges set featured = p_on where pet_id = p_pet and badge_key = p_key;
end $$;

-- ── Aylık macera ────────────────────────────────────────────────────────────
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
    v_awarded jsonb := '[]'::jsonb; v_grant json; v_all boolean := true; v_current int := null; i int; v_badge record;
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
        v_claimed := exists (select 1 from quest_rewards where user_id = v_owner and ref = 'adv:' || p_pet || ':' || v_month || ':' || i);
        if p_grant and v_stage_done and not v_claimed then
            v_grant := quest_grant(v_owner, p_pet, 'adv:' || p_pet || ':' || v_month || ':' || i, a.title || ': ' || (st ->> 'title'),
                                   coalesce((st ->> 'pawcoin')::int, 50), coalesce((st ->> 'xp')::int, 100));
            v_claimed := true;
            v_awarded := v_awarded || jsonb_build_object('label', st ->> 'title', 'pawcoin', (v_grant->>'pawcoin')::int, 'xp', (v_grant->>'xp')::int);
        end if;
        if not v_stage_done then v_all := false; if v_current is null then v_current := i; end if; end if;
        v_stages := v_stages || jsonb_build_object('index', i, 'title', st ->> 'title', 'story', st ->> 'story', 'emoji', st ->> 'emoji',
            'pawcoin', coalesce((st ->> 'pawcoin')::int, 50), 'xp', coalesce((st ->> 'xp')::int, 100),
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
        'final_pawcoin', a.final_pawcoin, 'current_stage', coalesce(v_current, jsonb_array_length(a.stages)), 'completed', v_all,
        'stages', v_stages, 'awarded', v_awarded,
        'month_pawcoin', (select coalesce(sum(pawcoin), 0) from quest_rewards where user_id = v_owner and pet_id = p_pet and created_at >= v_from and created_at < v_to),
        'month_badges', (select coalesce(json_agg(json_build_object('key', b.key, 'title', b.title, 'icon', b.icon) order by pb.earned_at), '[]'::json)
                           from pet_badges pb join badge_defs b on b.key = pb.badge_key
                          where pb.pet_id = p_pet and pb.earned_at >= v_from and pb.earned_at < v_to));
end $$;

create or replace function public.quest_adventure(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_past json;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_pet::text || ':qc', 0));
    select coalesce(json_agg(json_build_object('month', a.month, 'title', a.title, 'icon', b.icon,
                    'earned', exists (select 1 from pet_badges pb where pb.pet_id = p_pet and pb.badge_key = a.badge_key)) order by a.month desc), '[]'::json)
      into v_past from adventures a join badge_defs b on b.key = a.badge_key
     where a.published and a.month < to_char(qc_day(), 'YYYY-MM');
    return json_build_object('current', qc_adventure(p_pet, true), 'past', v_past);
end $$;

-- ── Görev Merkezi ana ekranı (E1): tek çağrı ─────────────────────────────────
create or replace function public.quest_center(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid(); v_day date := qc_day(); v_week date := qc_week_start(qc_day());
    v_pet record; r record; v_prog numeric; v_grant json;
    v_awarded jsonb := '[]'::jsonb; v_quests jsonb := '[]'::jsonb; v_done int := 0; v_total int := 0; v_rerolled boolean;
    v_days jsonb := '[]'::jsonb; v_d date; v_streak int := 0; w date; v_adv json; v_badges json; v_prog_row record;
    v_next json; v_lesson json; v_balance int; v_day_bonus boolean; v_xp int;
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

    select coalesce(jsonb_agg(jsonb_build_object('key', q.quest_key, 'title', d.title, 'description', d.description, 'why', d.why, 'how', d.how,
            'icon', d.icon, 'category', d.category, 'unit', d.unit, 'target', q.target, 'progress', least(q.progress, q.target),
            'completed', q.completed_at is not null, 'pawcoin', d.pawcoin, 'xp', d.xp, 'route', d.route, 'self_report', d.self_report,
            'scope', d.scope, 'can_reroll', d.scope = 'pool' and q.completed_at is null and not coalesce(v_rerolled, false),
            'history', qc_quest_history(p_pet, q.quest_key, v_day))
            order by d.scope, d.sort), '[]'::jsonb)
      into v_quests from pet_daily_quests q join quest_defs d on d.key = q.quest_key where q.pet_id = p_pet and q.day = v_day;

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
        'day_bonus', json_build_object('earned', v_day_bonus, 'pawcoin', 10, 'xp', 30),
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

-- Bir havuz görevini bugün bir kez değiştir (özerklik)
create or replace function public.quest_reroll(p_pet uuid, p_key text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_day date := qc_day(); v_new text;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_pet::text || ':qc', 0));
    if exists (select 1 from pet_daily_quests where pet_id = p_pet and day = v_day and rerolled) then raise exception 'Bugün bir görevi zaten değiştirdin'; end if;
    if not exists (select 1 from pet_daily_quests q join quest_defs d on d.key = q.quest_key
                    where q.pet_id = p_pet and q.day = v_day and q.quest_key = p_key and d.scope = 'pool' and q.completed_at is null) then
        raise exception 'Bu görev değiştirilemez';
    end if;
    select e.key into v_new from qc_pool_eligible(p_pet) e
     where not exists (select 1 from pet_daily_quests q where q.pet_id = p_pet and q.day = v_day and q.quest_key = e.key)
     order by md5(p_key || v_day::text || e.key) limit 1;
    if v_new is null then raise exception 'Şu an değiştirebileceğin başka görev yok'; end if;
    update pet_daily_quests set quest_key = v_new, target = qc_quest_target(p_pet, v_new),
           baseline = case when v_new = 'passport' then pet_passport_missing(p_pet) else 0 end, progress = 0, rerolled = true, created_at = now()
     where pet_id = p_pet and day = v_day and quest_key = p_key;
    return json_build_object('key', v_new);
end $$;

-- ── Günün bilgisi ───────────────────────────────────────────────────────────
create or replace function public.lessons_feed(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_sp text; v_ids text[]; v_n int; v_idx int; v_order text[] := '{}'; i int;
begin
    if p_pet is not null then
        if not exists (select 1 from pets where id = p_pet and owner_id = v_uid) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
        v_sp := pet_species(p_pet);
    end if;
    select array_agg(id order by sort, id) into v_ids from lessons where published and (species is null or v_sp is null or v_sp = any(species));
    v_n := coalesce(array_length(v_ids, 1), 0);
    if v_n = 0 then return json_build_object('today', null, 'featured', '[]'::json, 'recent', '[]'::json); end if;
    v_idx := (qc_day() - date '2026-01-01') % v_n;
    -- Bugünkü ve önceki günlerin bilgileri (dönüşümlü takvim)
    for i in 0 .. least(v_n, 12) - 1 loop
        v_order := v_order || v_ids[((v_idx - i) % v_n + v_n) % v_n + 1];
    end loop;
    return json_build_object(
        'today', (select json_build_object('id', l.id, 'title', l.title, 'summary', l.summary, 'emoji', l.emoji, 'tint', l.tint,
                    'read_minutes', l.read_minutes, 'category', l.category,
                    'read', exists (select 1 from lesson_reads r where r.user_id = v_uid and r.lesson_id = l.id))
                    from lessons l where l.id = v_order[1]),
        'featured', (select json_agg(json_build_object('id', l.id, 'title', l.title, 'summary', l.summary, 'emoji', l.emoji, 'tint', l.tint,
                        'read_minutes', l.read_minutes, 'read', exists (select 1 from lesson_reads r where r.user_id = v_uid and r.lesson_id = l.id))
                        order by array_position(v_order, l.id)) from lessons l where l.id = any(v_order[1:5])),
        'recent', (select json_agg(json_build_object('id', l.id, 'title', l.title, 'summary', l.summary, 'emoji', l.emoji, 'tint', l.tint,
                        'read_minutes', l.read_minutes, 'read', exists (select 1 from lesson_reads r where r.user_id = v_uid and r.lesson_id = l.id))
                        order by array_position(v_order, l.id)) from lessons l where l.id = any(v_order[2:12])));
end $$;

create or replace function public.lesson_view(p_id text)
returns json language sql security definer set search_path to 'public' as $$
    select json_build_object('id', l.id, 'title', l.title, 'summary', l.summary, 'body', l.body, 'tip', l.tip, 'emoji', l.emoji, 'tint', l.tint,
           'read_minutes', l.read_minutes, 'category', l.category, 'source', l.source, 'vet_reviewed', l.vet_reviewed,
           'read', exists (select 1 from lesson_reads r where r.user_id = auth.uid() and r.lesson_id = l.id))
      from lessons l where l.id = p_id and l.published
$$;

create or replace function public.lesson_mark_read(p_id text, p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_grant json; v_title text;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    select title into v_title from lessons where id = p_id and published;
    if v_title is null then raise exception 'Bilgi bulunamadı'; end if;
    insert into lesson_reads (user_id, lesson_id) values (v_uid, p_id) on conflict do nothing;
    if p_pet is not null and exists (select 1 from pets where id = p_pet and owner_id = v_uid) then
        v_grant := quest_grant(v_uid, p_pet, 'lesson:' || p_id, 'Bilgi: ' || v_title, 0, 10);
    end if;
    return json_build_object('xp', coalesce((v_grant->>'xp')::int, 0));
end $$;

-- ── Programlar ──────────────────────────────────────────────────────────────
create or replace function public.programs_list(p_pet uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_sp text;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    v_sp := pet_species(p_pet);
    return (select coalesce(json_agg(json_build_object('key', p.key, 'title', p.title, 'subtitle', p.subtitle, 'description', p.description,
                'tags', p.tags, 'emoji', p.emoji, 'tint', p.tint, 'days', jsonb_array_length(p.steps), 'pawcoin', p.pawcoin, 'xp', p.xp,
                'badge', (select json_build_object('title', b.title, 'icon', b.icon) from badge_defs b where b.key = p.badge_key),
                'status', pp.status, 'steps_done', coalesce(pp.steps_done, 0), 'for_you', p.species is not null)
                order by (pp.status = 'active') desc nulls last, p.sort), '[]'::json)
              from programs p left join pet_programs pp on pp.pet_id = p_pet and pp.program_key = p.key
             where p.published and (p.species is null or v_sp = any(p.species)));
end $$;

create or replace function public.program_view(p_pet uuid, p_key text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare p programs; pp pet_programs; v_steps jsonb := '[]'::jsonb; i int;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    select * into p from programs where key = p_key and published;
    if not found then raise exception 'Program bulunamadı'; end if;
    select * into pp from pet_programs where pet_id = p_pet and program_key = p_key;
    for i in 0 .. jsonb_array_length(p.steps) - 1 loop
        v_steps := v_steps || jsonb_build_object('index', i, 'title', p.steps -> i ->> 'title', 'body', p.steps -> i ->> 'body', 'tip', p.steps -> i ->> 'tip',
            'done', i < coalesce(pp.steps_done, 0), 'current', i = coalesce(pp.steps_done, 0));
    end loop;
    return json_build_object('key', p.key, 'title', p.title, 'subtitle', p.subtitle, 'description', p.description, 'tags', p.tags,
        'emoji', p.emoji, 'tint', p.tint, 'pawcoin', p.pawcoin, 'xp', p.xp, 'vet_reviewed', p.vet_reviewed,
        'badge', (select json_build_object('title', b.title, 'icon', b.icon) from badge_defs b where b.key = p.badge_key),
        'status', pp.status, 'steps_done', coalesce(pp.steps_done, 0), 'total', jsonb_array_length(p.steps),
        'today_done', pp.last_step_on = qc_day(),
        'other_active', (select json_build_object('key', x.program_key, 'title', y.title) from pet_programs x join programs y on y.key = x.program_key
                          where x.pet_id = p_pet and x.status = 'active' and x.program_key <> p_key limit 1),
        'steps', v_steps);
end $$;

create or replace function public.program_start(p_pet uuid, p_key text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_status text;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    if not exists (select 1 from programs where key = p_key and published and (species is null or pet_species(p_pet) = any(species))) then
        raise exception 'Bu program bu hayvan için uygun değil';
    end if;
    if exists (select 1 from pet_programs where pet_id = p_pet and status = 'active' and program_key <> p_key) then
        raise exception 'Önce aktif programını bitir ya da bırak';
    end if;
    select status into v_status from pet_programs where pet_id = p_pet and program_key = p_key;
    if v_status = 'done' then raise exception 'Bu programı zaten tamamladın'; end if;
    insert into pet_programs (pet_id, program_key) values (p_pet, p_key)
    on conflict (pet_id, program_key) do update set status = 'active';
end $$;

create or replace function public.program_step_done(p_pet uuid, p_key text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); pp pet_programs; p programs; v_total int; v_grant json; v_final json;
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = v_uid) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_pet::text || ':program', 0));
    select * into pp from pet_programs where pet_id = p_pet and program_key = p_key;
    if not found or pp.status <> 'active' then raise exception 'Bu program aktif değil'; end if;
    if pp.last_step_on = qc_day() then raise exception 'Bugünün adımını tamamladın; yarın devam edebilirsin'; end if;
    select * into p from programs where key = p_key;
    v_total := jsonb_array_length(p.steps);
    update pet_programs set steps_done = steps_done + 1, last_step_on = qc_day() where pet_id = p_pet and program_key = p_key;
    v_grant := quest_grant(v_uid, p_pet, 'pstep:' || p_pet || ':' || p_key || ':' || (pp.steps_done + 1), p.title || ' · ' || (pp.steps_done + 1) || '. gün', 0, 20);
    if pp.steps_done + 1 >= v_total then
        update pet_programs set status = 'done', completed_at = now() where pet_id = p_pet and program_key = p_key;
        if p.badge_key is not null then insert into pet_badges (pet_id, badge_key) values (p_pet, p.badge_key) on conflict do nothing; end if;
        v_final := quest_grant(v_uid, p_pet, 'program:' || p_pet || ':' || p_key, 'Program: ' || p.title, p.pawcoin, p.xp);
    end if;
    return json_build_object('steps_done', pp.steps_done + 1, 'total', v_total, 'completed', pp.steps_done + 1 >= v_total,
        'xp', (v_grant->>'xp')::int, 'final_pawcoin', coalesce((v_final->>'pawcoin')::int, 0), 'final_xp', coalesce((v_final->>'xp')::int, 0));
end $$;

create or replace function public.program_leave(p_pet uuid, p_key text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if not exists (select 1 from pets where id = p_pet and owner_id = auth.uid()) then raise exception 'Bu hayvan sana ait değil' using errcode = '42501'; end if;
    update pet_programs set status = 'left' where pet_id = p_pet and program_key = p_key and status = 'active';
end $$;

-- ── Birlikte: ortak hedef ───────────────────────────────────────────────────
create or replace function public.team_friend_candidates()
returns json language sql security definer set search_path to 'public' as $$
    select coalesce(json_agg(json_build_object('id', c.id, 'name', coalesce(c.full_name, c.username), 'avatar_url', c.avatar_url)
                    order by coalesce(c.full_name, c.username)), '[]'::json)
      from follows a
      join follows b on b.follower_id = a.following_id and b.following_id = a.follower_id
      join profile_cards c on c.id = a.following_id
     where a.follower_id = auth.uid()
$$;

create or replace function public.team_member_amount(p_kind text, p_user uuid, p_from timestamptz, p_to timestamptz)
returns numeric language plpgsql stable security definer set search_path to 'public' as $$
declare v numeric := 0;
begin
    if p_kind = 'walk_km' then
        select coalesce(sum(distance_meters), 0) / 1000.0 into v from walk_sessions
         where user_id = p_user and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_kind = 'walk_days' then
        select count(distinct (start_time at time zone 'Europe/Istanbul')::date) into v from walk_sessions
         where user_id = p_user and status = 'completed' and start_time >= p_from and start_time < p_to;
    elsif p_kind = 'care_days' then
        select coalesce(sum(pet_metric(p.id, 'care_days', p_from, p_to)), 0) into v from pets p where p.owner_id = p_user;
    elsif p_kind = 'lessons' then
        select count(*) into v from lesson_reads where user_id = p_user and read_at >= p_from and read_at < p_to;
    end if;
    return coalesce(v, 0);
end $$;

create or replace function public.team_goal_create(p_title text, p_kind text, p_target numeric, p_days integer, p_members uuid[])
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_m uuid; v_name text; v_members uuid[];
    v_max numeric := case p_kind when 'walk_km' then 1000 else 300 end;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    if char_length(trim(coalesce(p_title, ''))) not between 3 and 60 then raise exception 'Hedef adı 3–60 karakter olmalı'; end if;
    if p_kind not in ('walk_km', 'walk_days', 'care_days', 'lessons') then raise exception 'Geçersiz hedef türü'; end if;
    if p_days is null or p_days not between 3 and 30 then raise exception 'Süre 3 ile 30 gün arasında olmalı'; end if;
    if p_target is null or p_target <= 0 or p_target > v_max then raise exception 'Hedef değeri geçerli değil'; end if;
    select array_agg(distinct m) into v_members from unnest(coalesce(p_members, '{}')) m where m is not null and m <> v_uid;
    if coalesce(array_length(v_members, 1), 0) not between 1 and 4 then raise exception 'En az 1, en çok 4 arkadaş davet et'; end if;
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

create or replace function public.team_goal_respond(p_goal uuid, p_accept boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    update team_goal_members set status = case when p_accept then 'accepted' else 'declined' end, joined_at = case when p_accept then now() end
     where goal_id = p_goal and user_id = auth.uid() and status = 'invited'
       and exists (select 1 from team_goals g where g.id = p_goal and g.status = 'active');
    if not found then raise exception 'Bu davet artık geçerli değil'; end if;
end $$;

create or replace function public.team_goal_leave(p_goal uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    update team_goal_members set status = 'left' where goal_id = p_goal and user_id = auth.uid() and status = 'accepted';
    if not found then raise exception 'Bu hedefte değilsin'; end if;
    update team_goals set status = 'cancelled' where id = p_goal and status = 'active'
       and not exists (select 1 from team_goal_members where goal_id = p_goal and status = 'accepted');
end $$;

create or replace function public.team_goals_view()
returns json language plpgsql security definer set search_path to 'public' as $$
declare
    v_uid uuid := auth.uid(); g record; m record; v_total numeric; v_members jsonb; v_goals jsonb := '[]'::jsonb; v_invites jsonb := '[]'::jsonb;
    v_amount numeric; v_pet uuid; v_duels json;
begin
    if v_uid is null then raise exception 'Giriş gerekli'; end if;
    for g in select tg.*, me.status my_status from team_goals tg join team_goal_members me on me.goal_id = tg.id and me.user_id = v_uid
              where me.status in ('invited', 'accepted')
                and (tg.status = 'active' or (tg.status in ('completed', 'expired') and coalesce(tg.completed_at, tg.ends_at) > now() - interval '14 days'))
              order by tg.status = 'active' desc, tg.ends_at loop
        perform pg_advisory_xact_lock(hashtextextended(g.id::text || ':team', 0));
        v_total := 0; v_members := '[]'::jsonb;
        for m in select tm.user_id, tm.status, c.full_name, c.username, c.avatar_url from team_goal_members tm
                   left join profile_cards c on c.id = tm.user_id
                  where tm.goal_id = g.id and tm.status in ('invited', 'accepted') order by tm.status, c.full_name loop
            v_amount := case when m.status = 'accepted' then team_member_amount(g.kind, m.user_id, g.starts_at, least(g.ends_at, now())) else 0 end;
            v_total := v_total + v_amount;
            v_members := v_members || jsonb_build_object('id', m.user_id, 'name', coalesce(m.full_name, m.username), 'avatar_url', m.avatar_url,
                                                         'status', m.status, 'amount', round(v_amount, 1), 'me', m.user_id = v_uid);
        end loop;

        if g.status = 'active' and v_total >= g.target then
            update team_goals set status = 'completed', completed_at = now() where id = g.id and status = 'active';
            g.status := 'completed';
        elsif g.status = 'active' and now() > g.ends_at then
            update team_goals set status = 'expired' where id = g.id and status = 'active';
            g.status := 'expired';
        end if;
        -- Tamamlanan hedefin ödülü her üyeye kendi açtığında (XP en eski hayvanına)
        if g.status = 'completed' and g.my_status = 'accepted' then
            select id into v_pet from pets where owner_id = v_uid order by created_at limit 1;
            perform quest_grant(v_uid, v_pet, 'team:' || g.id, 'Birlikte: ' || g.title, 50, 100);
        end if;

        if g.my_status = 'invited' then
            v_invites := v_invites || jsonb_build_object('id', g.id, 'title', g.title, 'kind', g.kind, 'target', g.target, 'ends_at', g.ends_at,
                'creator', (select coalesce(full_name, username) from profile_cards where id = g.creator_id), 'members', v_members);
        else
            v_goals := v_goals || jsonb_build_object('id', g.id, 'title', g.title, 'kind', g.kind, 'target', g.target, 'total', round(v_total, 1),
                'status', g.status, 'starts_at', g.starts_at, 'ends_at', g.ends_at,
                'days_left', greatest(ceil(extract(epoch from (g.ends_at - now())) / 86400), 0), 'members', v_members,
                'is_creator', g.creator_id = v_uid, 'reward', json_build_object('pawcoin', 50, 'xp', 100));
        end if;
    end loop;

    -- Düellolar (var olan sistem: social_challenges)
    select coalesce(json_agg(json_build_object('id', s.id, 'status', s.status, 'starts_at', s.starts_at, 'ends_at', s.ends_at,
                'duration_days', s.duration_days, 'winner_id', s.winner_id, 'i_am_creator', s.creator_id = v_uid,
                'opponent', (select json_build_object('id', c.id, 'name', coalesce(c.full_name, c.username), 'avatar_url', c.avatar_url)
                               from profile_cards c where c.id = case when s.creator_id = v_uid then s.partner_id else s.creator_id end),
                'my_km', round(case when s.status in ('active', 'completed') then team_member_amount('walk_km', v_uid, s.starts_at, least(coalesce(s.ends_at, now()), now())) else 0 end, 2),
                'their_km', round(case when s.status in ('active', 'completed') then team_member_amount('walk_km',
                                  case when s.creator_id = v_uid then s.partner_id else s.creator_id end, s.starts_at, least(coalesce(s.ends_at, now()), now())) else 0 end, 2))
                order by s.created_at desc), '[]'::json)
      into v_duels from social_challenges s
     where s.mode = 'duel' and (s.creator_id = v_uid or s.partner_id = v_uid)
       and (s.status in ('pending', 'active') or s.created_at > now() - interval '14 days');

    return json_build_object('goals', v_goals, 'invites', v_invites, 'duels', v_duels);
end $$;

-- ── Yetkiler ────────────────────────────────────────────────────────────────
-- İç yardımcılar: yalnızca sunucu fonksiyonları
revoke execute on function public.qc_day(), public.qc_ts(date), public.qc_week_start(date), public.pet_species(uuid), public.pet_passport_missing(uuid),
    public.pet_emergency_set(uuid), public.pet_metric(uuid, text, timestamptz, timestamptz), public.qc_pool_eligible(uuid),
    public.qc_quest_target(uuid, text), public.qc_quest_progress(uuid, text, date, numeric, timestamptz), public.qc_ensure_day(uuid, date),
    public.qc_week_state(uuid, date), public.qc_badge_sync(uuid), public.qc_adventure(uuid, boolean),
    public.team_member_amount(text, uuid, timestamptz, timestamptz) from public, anon, authenticated;

-- İstemcinin çağırdıkları: yalnızca giriş yapmış kullanıcı
revoke execute on function public.quest_center(uuid), public.quest_reroll(uuid, text), public.quest_open_chest(uuid, date),
    public.quest_badges(uuid), public.quest_badge_feature(uuid, text, boolean), public.quest_adventure(uuid),
    public.lessons_feed(uuid), public.lesson_view(text), public.lesson_mark_read(text, uuid),
    public.programs_list(uuid), public.program_view(uuid, text), public.program_start(uuid, text), public.program_step_done(uuid, text),
    public.program_leave(uuid, text), public.team_friend_candidates(), public.team_goal_create(text, text, numeric, integer, uuid[]),
    public.team_goal_respond(uuid, boolean), public.team_goal_leave(uuid), public.team_goals_view() from public, anon;
grant execute on function public.quest_center(uuid), public.quest_reroll(uuid, text), public.quest_open_chest(uuid, date),
    public.quest_badges(uuid), public.quest_badge_feature(uuid, text, boolean), public.quest_adventure(uuid),
    public.lessons_feed(uuid), public.lesson_view(text), public.lesson_mark_read(text, uuid),
    public.programs_list(uuid), public.program_view(uuid, text), public.program_start(uuid, text), public.program_step_done(uuid, text),
    public.program_leave(uuid, text), public.team_friend_candidates(), public.team_goal_create(text, text, numeric, integer, uuid[]),
    public.team_goal_respond(uuid, boolean), public.team_goal_leave(uuid), public.team_goals_view() to authenticated;
