-- Görev satırında kısa durum (referans E1: "Aşı · 12 gün kaldı"): aşıda kalan/geciken gün, pasaportta eksik alan sayısı, acil kişi.
-- Ekim macerasının alt başlığı ekranın genel sloganıyla aynıydı (iki kez görünüyordu).
create or replace function public.qc_quest_hint(p_pet uuid, p_key text) returns text
language plpgsql stable security definer set search_path to 'public' as $$
declare v_due date; v_n int;
begin
    if p_key = 'vaccine_plan' then
        select min(next_due_date)::date into v_due from vaccines
         where pet_id = p_pet and next_due_date between now() - interval '60 days' and now() + interval '30 days';
        if v_due is null then return null; end if;
        v_n := v_due - qc_day();
        return case when v_n > 0 then v_n || ' gün kaldı' when v_n = 0 then 'Bugün' else (-v_n) || ' gün gecikti' end;
    elsif p_key = 'passport' then
        v_n := pet_passport_missing(p_pet);
        return case when v_n > 0 then v_n || ' bilgi eksik' end;
    elsif p_key = 'emergency' then
        return case when not pet_emergency_set(p_pet) then 'Henüz eklenmedi' end;
    end if;
    return null;
end $$;
revoke execute on function public.qc_quest_hint(uuid, text) from public, anon, authenticated;

update public.adventures set subtitle = 'Yaprak dökümünde mahallenin her köşesini birlikte keşfet.'
 where month = '2026-10' and subtitle = 'Her ay yeni bir macera, her adımda daha fazla keşif.';

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
            'completed', q.completed_at is not null, 'pawcoin', case when c.open then d.pawcoin else 0 end, 'coin_shared', not c.open, 'hint', qc_quest_hint(p_pet, q.quest_key),
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
