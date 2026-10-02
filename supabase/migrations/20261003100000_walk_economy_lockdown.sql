-- Yürüyüş modülü denetimi, A aşaması: puan, kupon, canlı konum ve yürüyüş kaydı güvenliği.
-- (1) İstemci artık puan miktarı söyleyemez: ödül miktarı, tekrar sıklığı ve günlük sınır sunucudaki
--     reward_rules tablosundan gelir; award_pati_puan istemciye kapanır, yerine claim_reward.
-- (2) Teslimat/kupon altyapısı olmayan ödül ürünleri satıştan kalkar.
-- (3) Canlı konum: tablo herkese okunur olmaktan çıkar, sadece bağlantıyı bilen tek kaydı okur.
-- (4) walk_sessions'a istemci doğrudan yazamaz: start_walk / append_walk_points / finish_walk /
--     add_walk_photo. Mesafe sunucuda hesaplanır, noktalar eklenerek (yeniden yazılmadan) saklanır.

-- ─── (1) Ödül kuralları ────────────────────────────────────────────────────────────────────────

create table if not exists public.reward_rules (
    key text primary key,
    pp integer not null check (pp >= 0 and pp <= 5000),
    period text not null check (period in ('daily', 'weekly', 'monthly', 'once')),
    counts_toward_daily_cap boolean not null default true,
    label text not null,
    is_active boolean not null default true
);

alter table public.reward_rules enable row level security;
revoke all on public.reward_rules from anon, authenticated;
grant select on public.reward_rules to authenticated;
create policy "Ödül kuralları herkese okunur" on public.reward_rules for select to authenticated using (true);

insert into public.reward_rules (key, pp, period, counts_toward_daily_cap, label) values
    ('quest:pet_feed', 10, 'daily', true, 'Mama Vakti'),
    ('quest:pet_water', 8, 'daily', true, 'Su Sevgisi'),
    ('quest:pet_weigh', 15, 'daily', true, 'Kilo Takibi'),
    ('quest:pet_vet', 20, 'daily', true, 'Vet Randevusu'),
    ('quest:pet_feed_week', 40, 'daily', true, '7 Gün Mama Serisi'),
    ('quest:first_walk', 25, 'daily', true, 'İlk Adım'),
    ('quest:walk_1km', 20, 'daily', true, '1 Km Yürüyüş'),
    ('quest:walk_daily_dist', 30, 'daily', true, 'Günlük Mesafe'),
    ('quest:walk_3km', 50, 'daily', true, 'Uzun Yürüyüş'),
    ('quest:walk_duration', 25, 'daily', true, 'Zaman Ustası'),
    ('quest:streak_3', 45, 'daily', true, '3 Günlük Seri'),
    ('quest:streak_7', 100, 'daily', true, '7 Günlük Seri'),
    ('quest:bad_weather_walk', 70, 'daily', true, 'Hava Fark Etmez'),
    ('quest:morning_walk', 30, 'daily', true, 'Sabah Yürüyüşü'),
    ('quest:evening_walk', 30, 'daily', true, 'Akşam Gezisi'),
    ('quest:streak_30', 300, 'daily', true, '30 Günlük Ateş'),
    ('quest:cumulative_50km', 200, 'daily', true, '50 Km Lejyoner'),
    ('quest:cumulative_100km', 500, 'daily', true, '100 Km Efsanesi'),
    ('quest:first_post', 15, 'daily', true, 'İlk Gönderi'),
    ('quest:first_comment', 10, 'daily', true, 'Yorum Yap'),
    ('quest:five_posts', 35, 'daily', true, '5 Gönderi'),
    ('quest:ten_likes', 30, 'daily', true, 'Beğeni Ustası'),
    ('quest:visit_petshop', 10, 'daily', true, 'Petshop Keşfi'),
    ('quest:try_ai', 15, 'daily', true, 'AI Deneyimi'),
    ('quest:both_walks', 60, 'daily', true, 'Çift Yürüyüş'),
    ('quest:weekly_active', 120, 'daily', true, 'Haftalık Aktif'),
    ('challenge:monthly_distance', 500, 'monthly', true, 'Aylık Yürüyüş Meydan Okuması'),
    ('challenge:weekly_spots', 150, 'weekly', true, 'Haftalık Patili Dostlar'),
    ('challenge:streak_master', 200, 'weekly', true, 'Seri Ustası'),
    ('research:stage_1', 500, 'monthly', true, 'Aylık Araştırma: İlk Adımlar'),
    ('research:stage_2', 1000, 'monthly', true, 'Aylık Araştırma: Mahalleni Fethet'),
    ('research:stage_3', 2500, 'monthly', true, 'Aylık Araştırma: Şehrin Efendisi'),
    ('stamps:weekly', 250, 'weekly', false, 'Haftalık 7 Pul Ödülü')
on conflict (key) do update set pp = excluded.pp, period = excluded.period,
    counts_toward_daily_cap = excluded.counts_toward_daily_cap, label = excluded.label;

-- Aynı ödül aynı dönemde ikinci kez yazılamaz (reference_id = '<kural>@<dönem>').
create unique index if not exists point_transactions_reward_once
    on public.point_transactions (user_id, reference_id) where source = 'reward';

create or replace function public.claim_reward(p_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_rule public.reward_rules%rowtype;
    v_local timestamp := now() at time zone 'Europe/Istanbul';
    v_day_start timestamptz := date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
    v_bucket text;
    v_ref text;
    v_used integer;
    v_award integer;
    v_balance integer;
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;

    select * into v_rule from public.reward_rules where key = p_key and is_active;
    if not found then
        raise exception 'Geçersiz ödül';
    end if;

    v_bucket := case v_rule.period
        when 'daily' then to_char(v_local, 'YYYY-MM-DD')
        when 'weekly' then to_char(v_local, 'IYYY-"W"IW')
        when 'monthly' then to_char(v_local, 'YYYY-MM')
        else 'once'
    end;
    v_ref := p_key || '@' || v_bucket;

    -- Aynı kullanıcının eşzamanlı iki isteği günlük sınırı birlikte aşamasın.
    perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':reward', 0));

    if exists (select 1 from public.point_transactions
               where user_id = v_user and source = 'reward' and reference_id = v_ref) then
        select pati_puan_balance into v_balance from public.profiles where id = v_user;
        return jsonb_build_object('awarded', 0, 'already_claimed', true, 'capped', false, 'balance', v_balance);
    end if;

    v_award := v_rule.pp;
    if v_rule.counts_toward_daily_cap then
        select coalesce(sum(t.amount), 0) into v_used
        from public.point_transactions t
        join public.reward_rules r on r.key = split_part(t.reference_id, '@', 1)
        where t.user_id = v_user and t.source = 'reward' and r.counts_toward_daily_cap
          and t.created_at >= v_day_start;
        v_award := greatest(0, least(v_award, 200 - v_used));
    end if;

    -- Sınıra takılıp 0 verilse bile kayıt düşülür: aynı ödül her açılışta yeniden denenmez.
    insert into public.point_transactions (user_id, amount, reason, source, reference_id)
    values (v_user, v_award, v_rule.label, 'reward', v_ref);

    update public.profiles set pati_puan_balance = pati_puan_balance + v_award
    where id = v_user
    returning pati_puan_balance into v_balance;

    return jsonb_build_object('awarded', v_award, 'already_claimed', false, 'capped', v_award < v_rule.pp, 'balance', v_balance);
end;
$$;

revoke execute on function public.claim_reward(text) from public, anon;
grant execute on function public.claim_reward(text) to authenticated;

-- İstemci artık doğrudan puan yazamaz (sunucu fonksiyonları sahibi olarak çağırmaya devam eder).
revoke execute on function public.award_pati_puan(integer, text, text, text) from public, anon, authenticated;

-- ─── (2) Teslimatı/kuponu olmayan ödül ürünleri satıştan kalkar ──────────────────────────────

update public.reward_products set is_active = false where is_active;

-- ─── (3) Canlı konum: sadece bağlantıyı bilen, tek kaydı okur ─────────────────────────────────

alter policy "Anyone can view unexpired beacons" on public.walk_beacons
    to authenticated using (user_id = auth.uid());
revoke all on public.walk_beacons from anon;

create or replace function public.get_walk_beacon(p_beacon_id uuid)
returns table (lat double precision, lng double precision, pet_name text, updated_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
    select b.lat, b.lng, b.pet_name, b.updated_at, b.expires_at
    from public.walk_beacons b
    where b.id = p_beacon_id and b.expires_at > now();
$$;

revoke execute on function public.get_walk_beacon(uuid) from public;
grant execute on function public.get_walk_beacon(uuid) to anon, authenticated;

-- ─── (4) Yürüyüş kaydı sadece sunucu fonksiyonlarıyla ─────────────────────────────────────────

alter table public.walk_sessions
    add column if not exists active_seconds integer,
    add column if not exists last_point_at timestamptz;

create or replace function public.walk_segment_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
set search_path to 'public'
as $$
    select 6371000 * 2 * asin(sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2)
        + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ));
$$;

revoke execute on function public.walk_segment_m(double precision, double precision, double precision, double precision) from public, anon, authenticated;

create or replace function public.start_walk(p_pet_id text default null)
returns public.walk_sessions
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_row public.walk_sessions;
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;
    if p_pet_id is not null and not exists (
        select 1 from public.pets where id::text = p_pet_id and owner_id = v_user
    ) then
        raise exception 'Bu hayvan sana ait değil';
    end if;

    -- Yarım kalmış oturum: bitiş "şu an" değil son konumun zamanıdır; hiç yol yoksa kayda girmez.
    update public.walk_sessions
    set status = case when coalesce(distance_meters, 0) > 0 then 'completed' else 'discarded' end,
        end_time = coalesce(last_point_at, start_time)
    where user_id = v_user and status = 'active';

    insert into public.walk_sessions (user_id, pet_id, status, path_coordinates, distance_meters)
    values (v_user, p_pet_id, 'active', '[]'::jsonb, 0)
    returning * into v_row;

    return v_row;
end;
$$;

-- Noktalar {lat, lng, timestamp(ISO)} dizisi. Zamanı öncekinden eski/eşit olan nokta (tekrar ya da
-- sıra dışı gönderim) atlanır; 25 km/sa üstü sıçrama konumu günceller ama mesafeye eklenmez.
create or replace function public.append_walk_points(p_session_id uuid, p_points jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_s record;
    v_count integer;
    v_pt jsonb;
    v_last_lat double precision;
    v_last_lng double precision;
    v_last_t timestamptz;
    v_lat double precision;
    v_lng double precision;
    v_t timestamptz;
    v_seg double precision;
    v_add double precision := 0;
    v_accepted jsonb := '[]'::jsonb;
    v_distance numeric;
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;
    if p_points is null or jsonb_typeof(p_points) <> 'array' then
        raise exception 'Geçersiz konum verisi';
    end if;
    if jsonb_array_length(p_points) > 600 then
        raise exception 'Tek seferde en fazla 600 nokta gönderilebilir';
    end if;

    select id, status, path_coordinates into v_s
    from public.walk_sessions
    where id = p_session_id and user_id = v_user
    for update;
    if not found then
        raise exception 'Yürüyüş bulunamadı';
    end if;
    if v_s.status <> 'active' then
        raise exception 'Bu yürüyüş zaten bitmiş';
    end if;

    v_count := jsonb_array_length(coalesce(v_s.path_coordinates, '[]'::jsonb));
    if v_count + jsonb_array_length(p_points) > 20000 then
        raise exception 'Yürüyüş nokta sınırı aşıldı';
    end if;
    if v_count > 0 then
        v_pt := v_s.path_coordinates -> (v_count - 1);
        v_last_lat := (v_pt ->> 'lat')::double precision;
        v_last_lng := (v_pt ->> 'lng')::double precision;
        v_last_t := (v_pt ->> 'timestamp')::timestamptz;
    end if;

    for v_pt in select value from jsonb_array_elements(p_points) loop
        begin
            v_lat := (v_pt ->> 'lat')::double precision;
            v_lng := (v_pt ->> 'lng')::double precision;
            v_t := (v_pt ->> 'timestamp')::timestamptz;
        exception when others then
            continue;
        end;
        if v_lat is null or v_lng is null or v_t is null
           or v_lat not between -90 and 90 or v_lng not between -180 and 180
           or v_t > now() + interval '10 minutes' then
            continue;
        end if;
        if v_last_t is not null and v_t <= v_last_t then
            continue;
        end if;
        if v_last_lat is not null then
            v_seg := public.walk_segment_m(v_last_lat, v_last_lng, v_lat, v_lng);
            if v_seg / greatest(extract(epoch from (v_t - v_last_t)), 1) * 3.6 <= 25 then
                v_add := v_add + v_seg;
            end if;
        end if;
        v_accepted := v_accepted || jsonb_build_array(jsonb_build_object('lat', v_lat, 'lng', v_lng, 'timestamp', v_t));
        v_last_lat := v_lat;
        v_last_lng := v_lng;
        v_last_t := v_t;
    end loop;

    update public.walk_sessions
    set path_coordinates = coalesce(path_coordinates, '[]'::jsonb) || v_accepted,
        distance_meters = coalesce(distance_meters, 0) + round(v_add::numeric),
        last_point_at = coalesce(v_last_t, last_point_at)
    where id = p_session_id
    returning distance_meters into v_distance;

    return jsonb_build_object('accepted', jsonb_array_length(v_accepted), 'distance_meters', v_distance);
end;
$$;

-- p_active_seconds: duraklamalar hariç süre (duvar saatini aşamaz). p_steps: ivmeölçer sayımı
-- (saniyede 4 adımı aşamaz; yoksa boş kalır, uydurulmaz). p_end_at_last_point: kurtarılan yürüyüşü
-- "burada bitir" deyince bitiş son konumun zamanı olur (saatler sonrası değil). Ne yol ne adım
-- varsa yürüyüş 'discarded' olur: geçmişe, istatistiğe ve sıralamaya girmez.
create or replace function public.finish_walk(
    p_session_id uuid,
    p_active_seconds integer default null,
    p_steps integer default null,
    p_points jsonb default '[]'::jsonb,
    p_end_at_last_point boolean default false
)
returns public.walk_sessions
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_row public.walk_sessions;
    v_end timestamptz;
    v_wall integer;
    v_active integer;
    v_steps integer;
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;

    select * into v_row from public.walk_sessions where id = p_session_id and user_id = v_user;
    if not found then
        raise exception 'Yürüyüş bulunamadı';
    end if;
    if v_row.status <> 'active' then
        return v_row;
    end if;

    if p_points is not null and jsonb_typeof(p_points) = 'array' and jsonb_array_length(p_points) > 0 then
        perform public.append_walk_points(p_session_id, p_points);
    end if;

    select * into v_row from public.walk_sessions where id = p_session_id for update;

    v_end := case when p_end_at_last_point then coalesce(v_row.last_point_at, v_row.start_time) else now() end;
    v_wall := greatest(0, floor(extract(epoch from (v_end - v_row.start_time))))::integer;
    v_active := least(greatest(coalesce(p_active_seconds, v_wall), 0), v_wall);
    v_steps := case when p_steps is null or p_steps <= 0 then null
                    else least(p_steps, greatest(v_active, 1) * 4) end;

    update public.walk_sessions
    set status = case when coalesce(distance_meters, 0) > 0 or coalesce(v_steps, 0) > 0 then 'completed' else 'discarded' end,
        end_time = v_end,
        active_seconds = v_active,
        steps = v_steps
    where id = p_session_id
    returning * into v_row;

    return v_row;
end;
$$;

create or replace function public.add_walk_photo(p_session_id uuid, p_url text)
returns text[]
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_user uuid := auth.uid();
    v_urls text[];
begin
    if v_user is null then
        raise exception 'Giriş gerekli';
    end if;
    if p_url is null or position('/walk-photos/' || v_user::text || '/' || p_session_id::text || '/' in p_url) = 0 then
        raise exception 'Geçersiz fotoğraf adresi';
    end if;

    update public.walk_sessions
    set photo_urls = coalesce(photo_urls, '{}') || p_url
    where id = p_session_id and user_id = v_user and coalesce(array_length(photo_urls, 1), 0) < 30
    returning photo_urls into v_urls;

    if v_urls is null then
        raise exception 'Fotoğraf eklenemedi';
    end if;
    return v_urls;
end;
$$;

revoke execute on function public.start_walk(text) from public, anon;
revoke execute on function public.append_walk_points(uuid, jsonb) from public, anon;
revoke execute on function public.finish_walk(uuid, integer, integer, jsonb, boolean) from public, anon;
revoke execute on function public.add_walk_photo(uuid, text) from public, anon;
grant execute on function public.start_walk(text) to authenticated;
grant execute on function public.append_walk_points(uuid, jsonb) to authenticated;
grant execute on function public.finish_walk(uuid, integer, integer, jsonb, boolean) to authenticated;
grant execute on function public.add_walk_photo(uuid, text) to authenticated;

-- İstemci tabloyu sadece okur; anon hiç erişemez (önceden TRUNCATE dahil tam yetkiliydi).
revoke all on public.walk_sessions from anon, authenticated;
grant select on public.walk_sessions to authenticated;
