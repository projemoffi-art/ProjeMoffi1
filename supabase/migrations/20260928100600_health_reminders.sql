-- Sağlık hatırlatmaları (Sağlık Kaydı S4): aşı, parazit ve ilaç dozu. Tek kaynak `notifications`
-- (type='health'); aşı/parazit ayrıca e-postayla da gider. Eski, sadece "planlanmış" aşılara bakan
-- ve yeni modelde uygulanmış aşıların sonraki dozunu hiç görmeyen push cron'u kapatıldı.

create table if not exists public.health_reminder_log (
    key text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
alter table public.health_reminder_log enable row level security; -- istemciye kapalı (policy yok)

-- notify_user: 'health' türü de e-postaya düşer (Sağlık Merkezi'ne link).
create or replace function public.notify_user(p_user_id uuid, p_type text, p_title text, p_content text, p_actor_id uuid, p_entity_id text)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_is_business boolean;
begin
  if p_user_id is null or p_user_id = p_actor_id then return; end if;
  insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
  values (p_user_id, p_type, p_title, p_content, p_actor_id, p_entity_id, false);
  if p_type in ('appointment', 'order', 'health') then
    select role = 'business' into v_is_business from profiles where id = p_user_id;
    perform enqueue_email(p_user_id, 'Moffi · ' || p_title, p_title, p_content,
      case
        when p_type = 'health' then '/health'
        when p_type = 'appointment' and coalesce(v_is_business, false) then '/business/calendar'
        when p_type = 'appointment' then '/vet'
        when coalesce(v_is_business, false) then '/business/orders'
        else '/petshop'
      end);
  end if;
end;
$function$;

-- Günlük: aşı ve parazit tarihleri (14 ve 3 gün kala, günü geldiğinde, 7 gün gecikince).
create or replace function public.enqueue_health_due_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare
    v_today date := (wall_now())::date;
    v_count int := 0;
    r record; v_stage text; v_days int; v_key text; v_title text;
begin
    for r in
        -- Aşılar: her aşının (tanım ya da ad) geçerli tarihi = açık plan, yoksa son dozun sonraki tarihi.
        select p.owner_id, p.id as pet_id, p.name as pet_name, v.name as item, 'vac' as kind,
               coalesce(v.definition_id, lower(v.name)) as item_key, v.next_due_date::date as due
        from (
            select distinct on (pet_id, coalesce(definition_id, lower(name))) *
            from vaccines
            where next_due_date is not null
            -- En yeni kayıt belirleyicidir: plandan sonra yapılmış doz planı geçersiz kılar (istemciyle aynı kural).
            order by pet_id, coalesce(definition_id, lower(name)),
                     coalesce(date_administered, created_at) desc, (status = 'pending') desc
        ) v join pets p on p.id = v.pet_id
        union all
        select p.owner_id, p.id, p.name,
               case t.kind when 'internal' then 'İç parazit uygulaması' else 'Dış parazit uygulaması' end,
               'par', t.kind, t.due
        from (
            select k.pet_id, k.kind,
                   coalesce(
                     (select pl.next_due_on from parasite_treatments pl
                       where pl.pet_id = k.pet_id and pl.status = 'planned' and pl.kind in (k.kind, 'combined')
                         and pl.created_at::date > coalesce((select max(d.applied_on) from parasite_treatments d
                               where d.pet_id = k.pet_id and d.status = 'done' and d.kind in (k.kind, 'combined')), '1900-01-01')
                       order by pl.next_due_on limit 1),
                     (select d.next_due_on from parasite_treatments d
                       where d.pet_id = k.pet_id and d.status = 'done' and d.kind in (k.kind, 'combined')
                       order by d.applied_on desc limit 1)) as due
            from (select distinct pet_id, unnest(case kind when 'combined' then array['internal','external'] else array[kind] end) as kind
                  from parasite_treatments) k
        ) t join pets p on p.id = t.pet_id
    loop
        continue when r.due is null or r.owner_id is null;
        v_days := r.due - v_today;
        v_stage := case when v_days = 14 then '14' when v_days = 3 then '3' when v_days = 0 then '0' when v_days = -7 then 'late' end;
        continue when v_stage is null;
        v_key := r.kind || ':' || r.pet_id || ':' || r.item_key || ':' || r.due || ':' || v_stage;
        continue when exists (select 1 from health_reminder_log where key = v_key);
        insert into health_reminder_log (key, user_id) values (v_key, r.owner_id);
        v_title := r.pet_name || ' · ' || r.item || case v_stage
            when '14' then ' için 2 hafta kaldı' when '3' then ' için 3 gün kaldı'
            when '0' then ' bugün' else ' 1 haftadır gecikti' end;
        perform notify_user(r.owner_id, 'health', v_title,
            to_char(r.due, 'DD.MM.YYYY') || ' tarihli. Yaptıysan Sağlık Karnesi''nde işaretle; tarihi oradan değiştirebilirsin.',
            null, r.pet_id::text);
        v_count := v_count + 1;
    end loop;
    return v_count;
end $$;

-- 5 dakikada bir: saati gelmiş ve verilmemiş ilaç dozu (sadece uygulama içi bildirim; e-posta yok).
create or replace function public.enqueue_medication_dose_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare
    v_now timestamp := (wall_now() at time zone 'UTC');
    v_today date := v_now::date;
    v_count int := 0;
    r record; v_key text;
begin
    for r in
        select m.id, m.name, m.dosage, m.pet_id, p.name as pet_name, p.owner_id, s.t as dose_slot
        from medications m join pets p on p.id = m.pet_id, unnest(m.dose_times) as s(t)
        where m.is_active and (m.end_date is null or m.end_date >= v_today)
          and (m.start_date is null or (m.start_date at time zone 'Europe/Istanbul')::date <= v_today)
          and s.t ~ '^\d{2}:\d{2}$'
          and v_now >= v_today + s.t::time and v_now < v_today + s.t::time + interval '15 minutes'
          and not exists (select 1 from medication_doses d where d.medication_id = m.id and d.dose_date = v_today and d.slot = s.t)
    loop
        v_key := 'dose:' || r.id || ':' || v_today || ':' || r.dose_slot;
        continue when exists (select 1 from health_reminder_log where key = v_key);
        insert into health_reminder_log (key, user_id) values (v_key, r.owner_id);
        insert into notifications (user_id, type, title, content, actor_id, entity_id, is_read)
        values (r.owner_id, 'health', r.pet_name || ' · ' || r.name || ' zamanı',
                r.dose_slot || coalesce(' · ' || r.dosage, '') || '. Verdiysen İlaçlar ekranında işaretle.', null, r.pet_id::text, false);
        v_count := v_count + 1;
    end loop;
    return v_count;
end $$;

revoke execute on function public.enqueue_health_due_reminders() from public;
revoke execute on function public.enqueue_medication_dose_reminders() from public;

select cron.unschedule('vaccine-reminders-daily') where exists (select 1 from cron.job where jobname = 'vaccine-reminders-daily');
select cron.schedule('health-due-reminders-daily', '0 6 * * *', 'select public.enqueue_health_due_reminders();');
select cron.schedule('medication-dose-reminders', '*/5 * * * *', 'select public.enqueue_medication_dose_reminders();');
