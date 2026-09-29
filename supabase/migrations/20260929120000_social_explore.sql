-- Faz 3 — Keşfet (design-reference/community-final/kesfet-reference.jpg).
-- Çoklu fotoğraf, hayvan etiketleme, semt düzeyinde konum, konu, profilde gösterme; tek seviyeli yanıt;
-- kaydetme; gerçek engelleme; akış/arama/profil sunucu fonksiyonları. Açık yazma kuralları kapatıldı.

-- 0) Kodda kullanılmayan, profiles tablosunu doğrudan açan görünüm
drop view if exists public.feed_view;

-- 1) Gönderi alanları ------------------------------------------------------------------------------
alter table public.posts
    add column if not exists media_urls text[] not null default '{}',
    add column if not exists tagged_pet_ids uuid[] not null default '{}',
    add column if not exists pet_species text[] not null default '{}',
    add column if not exists pet_names text not null default '',
    add column if not exists has_young_pet boolean not null default false,
    add column if not exists location_text text,
    add column if not exists area_lat double precision,
    add column if not exists area_lng double precision,
    add column if not exists topic text,
    add column if not exists show_on_profile boolean not null default true,
    add column if not exists edited_at timestamptz;

update public.posts set media_urls = array[media_url] where media_url is not null and cardinality(media_urls) = 0;
update public.posts set status = 'published' where status is distinct from 'published';
update public.posts set comment_privacy = 'nobody' where allow_comments = false;

alter table public.posts
    drop column if exists location,
    drop column if exists mood,
    drop column if exists audio_url,
    drop column if exists scheduled_at;

alter table public.posts drop constraint if exists posts_topic_check;
alter table public.posts add constraint posts_topic_check check (topic is null or topic in ('daily', 'funny', 'training', 'health', 'other'));
alter table public.posts drop constraint if exists posts_comment_privacy_check;
alter table public.posts add constraint posts_comment_privacy_check check (comment_privacy in ('everyone', 'followers', 'nobody'));
alter table public.posts drop constraint if exists posts_limits_check;
alter table public.posts add constraint posts_limits_check check (
    char_length(coalesce(content, '')) <= 1000 and cardinality(media_urls) between 1 and 10
    and cardinality(tagged_pet_ids) <= 5 and char_length(coalesce(location_text, '')) <= 80);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);

-- İstemci yazmalarını süzer: sahiplik, sayaçlar, etiketlenen hayvanlar (sadece kendi hayvanın), konum yuvarlama.
create or replace function public.posts_guard()
returns trigger language plpgsql set search_path = public as $$
declare v_client boolean := current_user in ('authenticated', 'anon');
begin
    if tg_op = 'UPDATE' then
        new.user_id := old.user_id; new.created_at := old.created_at;
        if v_client then
            new.likes_count := old.likes_count; new.comments_count := old.comments_count;
            if new.content is distinct from old.content or new.media_urls is distinct from old.media_urls
               or new.tagged_pet_ids is distinct from old.tagged_pet_ids or new.location_text is distinct from old.location_text then
                new.edited_at := now();
            end if;
        end if;
    elsif v_client then
        new.likes_count := 0; new.comments_count := 0; new.edited_at := null;
    end if;
    new.status := 'published';
    new.media_urls := coalesce(new.media_urls, '{}');
    new.media_url := new.media_urls[1];
    new.allow_comments := coalesce(new.comment_privacy, 'everyone') <> 'nobody';
    -- Etiketler ve konum sadece değiştiğinde denetlenir (sayaç güncellemeleri bunlara dokunmaz).
    if tg_op = 'INSERT' or new.tagged_pet_ids is distinct from old.tagged_pet_ids then
        new.tagged_pet_ids := coalesce(array(select distinct x from unnest(new.tagged_pet_ids) x), '{}');
        if exists (select 1 from unnest(new.tagged_pet_ids) t where not exists (select 1 from pets p where p.id = t and p.owner_id = new.user_id)) then
            raise exception 'Sadece kendi hayvanlarını etiketleyebilirsin.';
        end if;
        select coalesce(array_agg(distinct case when lower(p.type) in ('cat', 'kedi') then 'cat' when lower(p.type) in ('dog', 'köpek') then 'dog' else 'other' end), '{}'),
               coalesce(string_agg(concat_ws(' ', p.name, p.breed), ' '), ''),
               coalesce(bool_or(p.birth_date > current_date - interval '1 year'), false)
          into new.pet_species, new.pet_names, new.has_young_pet
          from pets p where p.id = any(new.tagged_pet_ids);
    end if;
    if tg_op = 'INSERT' or new.location_text is distinct from old.location_text
       or new.area_lat is distinct from old.area_lat or new.area_lng is distinct from old.area_lng then
        new.location_text := nullif(trim(coalesce(new.location_text, '')), '');
        if new.location_text is null then
            new.area_lat := null; new.area_lng := null;
        else
            new.area_lat := round((new.area_lat / 0.01)::numeric) * 0.01;
            new.area_lng := round((new.area_lng / 0.01)::numeric) * 0.01;
        end if;
    end if;
    return new;
end;
$$;
drop trigger if exists posts_guard on public.posts;
create trigger posts_guard before insert or update on public.posts for each row execute function public.posts_guard();

-- 2) Engelleme ---------------------------------------------------------------------------------------
create or replace function public.is_blocked_between(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
    select auth.uid() is not null and exists (
        select 1 from blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p_other) or (b.blocker_id = p_other and b.blocked_id = auth.uid()));
$$;
revoke execute on function public.is_blocked_between(uuid) from public;
grant execute on function public.is_blocked_between(uuid) to anon, authenticated;

drop policy if exists "Users manage own blocks" on public.blocks;
drop policy if exists "Blocks: own" on public.blocks;
create policy "Blocks: own" on public.blocks for select to authenticated using (blocker_id = auth.uid());
revoke all on public.blocks from anon, authenticated;
grant select on public.blocks to authenticated;

create or replace function public.block_user(p_target uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'Giriş gerekli.'; end if;
    if p_target = auth.uid() then raise exception 'Kendini engelleyemezsin.'; end if;
    insert into blocks (blocker_id, blocked_id) values (auth.uid(), p_target) on conflict (blocker_id, blocked_id) do nothing;
    delete from follows where (follower_id = auth.uid() and following_id = p_target) or (follower_id = p_target and following_id = auth.uid());
end;
$$;
revoke execute on function public.block_user(uuid) from public;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_target uuid)
returns void language sql volatile security definer set search_path = public as $$
    delete from blocks where blocker_id = auth.uid() and blocked_id = p_target;
$$;
revoke execute on function public.unblock_user(uuid) from public;
grant execute on function public.unblock_user(uuid) to authenticated;

-- 3) Gönderi kuralları: 18 kuralın yerine dört kural. Engelli çiftin gönderileri birbirine görünmez.
do $$ declare r record; begin
    for r in select polname from pg_policy where polrelid = 'public.posts'::regclass loop
        execute format('drop policy %I on public.posts', r.polname);
    end loop;
end $$;
create policy "Posts: read" on public.posts for select using (
    user_id = auth.uid() or get_my_role() = 'admin' or not is_blocked_between(user_id));
create policy "Posts: own insert" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "Posts: own update" on public.posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Posts: own or admin delete" on public.posts for delete to authenticated using (user_id = auth.uid() or get_my_role() = 'admin');
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert (user_id, content, media_urls, tagged_pet_ids, location_text, area_lat, area_lng, topic, show_on_profile, comment_privacy, is_video)
    on public.posts to authenticated;
grant update (content, media_urls, tagged_pet_ids, location_text, area_lat, area_lng, topic, show_on_profile, comment_privacy)
    on public.posts to authenticated;
grant delete on public.posts to authenticated;

-- 4) Beğeniler: herkesin herkes adına beğeni ekleyip silebildiği "Universal" kural kaldırıldı -----------
do $$ declare r record; begin
    for r in select polname from pg_policy where polrelid = 'public.likes'::regclass loop
        execute format('drop policy %I on public.likes', r.polname);
    end loop;
end $$;
create policy "Likes: read" on public.likes for select using (true);
create policy "Likes: own insert" on public.likes for insert to authenticated with check (user_id = auth.uid() and not is_blocked_between((select user_id from posts where id = post_id)));
create policy "Likes: own delete" on public.likes for delete to authenticated using (user_id = auth.uid());
revoke all on public.likes from anon, authenticated;
grant select on public.likes to anon, authenticated;
grant insert (post_id, user_id), delete on public.likes to authenticated;

-- 5) Kaydedilenler -----------------------------------------------------------------------------------
create table if not exists public.post_saves (
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    post_id uuid not null references public.posts(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, post_id)
);
alter table public.post_saves enable row level security;
drop policy if exists "Saves: own" on public.post_saves;
create policy "Saves: own" on public.post_saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.post_saves from anon, authenticated;
grant select, insert, delete on public.post_saves to authenticated;

-- 6) Yorumlar: tek seviyeli yanıt; herkesin her yorumu silip değiştirebildiği kurallar kaldırıldı ----------
alter table public.comments
    add column if not exists parent_id uuid references public.comments(id) on delete cascade,
    add column if not exists edited_at timestamptz;
alter table public.comments drop constraint if exists comments_content_check;
alter table public.comments add constraint comments_content_check check (char_length(trim(content)) between 1 and 500);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

create or replace function public.enforce_comment_settings()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_privacy text; v_owner uuid; v_filter text[]; v_word text; v_parent public.comments;
begin
    if tg_op = 'UPDATE' then
        new.post_id := old.post_id; new.user_id := old.user_id; new.parent_id := old.parent_id;
        new.likes_count := old.likes_count; new.created_at := old.created_at; new.status := old.status;
        if new.content is distinct from old.content then new.edited_at := now(); end if;
        return new;
    end if;
    select p.comment_privacy, p.user_id, pr.comment_filter_words into v_privacy, v_owner, v_filter
      from posts p left join profiles pr on pr.id = p.user_id where p.id = new.post_id;
    if v_owner is null then raise exception 'Gönderi bulunamadı.'; end if;
    if v_privacy = 'nobody' and new.user_id <> v_owner then raise exception 'Bu gönderi yorumlara kapalı.'; end if;
    if v_privacy = 'followers' and new.user_id <> v_owner
       and not exists (select 1 from follows where follower_id = new.user_id and following_id = v_owner) then
        raise exception 'Bu gönderiye sadece takipçiler yorum yapabilir.';
    end if;
    if exists (select 1 from blocks where (blocker_id = v_owner and blocked_id = new.user_id) or (blocker_id = new.user_id and blocked_id = v_owner)) then
        raise exception 'Bu gönderiye yorum yapamazsın.';
    end if;
    if new.parent_id is not null then
        select * into v_parent from comments where id = new.parent_id;
        if not found or v_parent.post_id <> new.post_id then raise exception 'Yanıtlanan yorum bulunamadı.'; end if;
        if v_parent.parent_id is not null then new.parent_id := v_parent.parent_id; end if;
    end if;
    new.likes_count := 0; new.edited_at := null;
    new.status := 'approved';
    if v_filter is not null then
        foreach v_word in array v_filter loop
            if nullif(trim(v_word), '') is not null and new.content ilike '%' || v_word || '%' then new.status := 'pending'; exit; end if;
        end loop;
    end if;
    return new;
end;
$$;
drop trigger if exists trigger_enforce_comment_settings on public.comments;
create trigger trigger_enforce_comment_settings before insert or update on public.comments
    for each row execute function public.enforce_comment_settings();

do $$ declare r record; begin
    for r in select polname from pg_policy where polrelid = 'public.comments'::regclass loop
        execute format('drop policy %I on public.comments', r.polname);
    end loop;
end $$;
create policy "Comments: read" on public.comments for select using (
    (status = 'approved' and not is_blocked_between(user_id)) or user_id = auth.uid()
    or exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "Comments: own insert" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "Comments: own update" on public.comments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Comments: own or post owner or admin delete" on public.comments for delete to authenticated using (
    user_id = auth.uid() or get_my_role() = 'admin' or exists (select 1 from posts p where p.id = post_id and p.user_id = auth.uid()));
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (post_id, user_id, content, parent_id) on public.comments to authenticated;
grant update (content) on public.comments to authenticated;
grant delete on public.comments to authenticated;

-- Yorum sayacı sadece onaylı yorumları sayar; yanıta yanıt bildirimi
create or replace function public.sync_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    update posts set comments_count = (select count(*) from comments c where c.post_id = coalesce(new.post_id, old.post_id) and c.status = 'approved')
    where id = coalesce(new.post_id, old.post_id);
    return null;
end;
$$;

create or replace function public.trigger_notify_post_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_name text; v_parent_user uuid;
begin
    if new.status <> 'approved' then return new; end if;
    select user_id into v_owner from posts where id = new.post_id;
    select coalesce(full_name, username, 'Biri') into v_name from profiles where id = new.user_id;
    if new.parent_id is not null then
        select user_id into v_parent_user from comments where id = new.parent_id;
        if v_parent_user is not null and v_parent_user <> new.user_id then
            perform notify_user(v_parent_user, 'comment', v_name || ' yorumuna yanıt verdi.', left(new.content, 140), new.user_id, new.post_id::text);
        end if;
    end if;
    if v_owner is not null and v_owner <> new.user_id and v_owner is distinct from v_parent_user then
        perform notify_user(v_owner, 'comment', v_name || ' gönderine yorum yaptı.', left(new.content, 140), new.user_id, new.post_id::text);
    end if;
    return new;
end;
$$;

-- 7) Yorum beğenileri ----------------------------------------------------------------------------------
do $$ declare r record; begin
    for r in select polname from pg_policy where polrelid = 'public.comment_likes'::regclass loop
        execute format('drop policy %I on public.comment_likes', r.polname);
    end loop;
end $$;
create policy "Comment likes: read" on public.comment_likes for select using (true);
create policy "Comment likes: own insert" on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
create policy "Comment likes: own delete" on public.comment_likes for delete to authenticated using (user_id = auth.uid());
revoke all on public.comment_likes from anon, authenticated;
grant select on public.comment_likes to anon, authenticated;
grant insert (comment_id, user_id), delete on public.comment_likes to authenticated;
alter function public.update_comment_likes_count() security definer;
alter function public.update_comment_likes_count() set search_path = public;

-- 8) Takip: sadece ekle/sil; engelli çift takip edemez
do $$ declare r record; begin
    for r in select polname from pg_policy where polrelid = 'public.follows'::regclass loop
        execute format('drop policy %I on public.follows', r.polname);
    end loop;
end $$;
create policy "Follows: read" on public.follows for select using (true);
create policy "Follows: own insert" on public.follows for insert to authenticated with check (follower_id = auth.uid() and following_id <> auth.uid() and not is_blocked_between(following_id));
create policy "Follows: own delete" on public.follows for delete to authenticated using (follower_id = auth.uid());
revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert (follower_id, following_id), delete on public.follows to authenticated;

-- 9) Hikâyeler: süresi dolanlar sadece sahibine; kimin baktığını sadece hikâye sahibi görür
do $$ declare r record; begin
    for r in select polname from pg_policy where polrelid = 'public.stories'::regclass loop
        execute format('drop policy %I on public.stories', r.polname);
    end loop;
    for r in select polname from pg_policy where polrelid = 'public.story_views'::regclass loop
        execute format('drop policy %I on public.story_views', r.polname);
    end loop;
end $$;
create policy "Stories: read active" on public.stories for select using ((expires_at > now() and not is_blocked_between(user_id)) or user_id = auth.uid());
create policy "Stories: own insert" on public.stories for insert to authenticated with check (user_id = auth.uid());
create policy "Stories: own delete" on public.stories for delete to authenticated using (user_id = auth.uid());
revoke all on public.stories from anon, authenticated;
grant select on public.stories to anon, authenticated;
grant insert (user_id, image_url, caption, expires_at), delete on public.stories to authenticated;

create policy "Story views: viewer or story owner" on public.story_views for select to authenticated
    using (viewer_id = auth.uid() or exists (select 1 from stories s where s.id = story_id and s.user_id = auth.uid()));
create policy "Story views: own insert" on public.story_views for insert to authenticated with check (viewer_id = auth.uid());
create policy "Story views: own update" on public.story_views for update to authenticated using (viewer_id = auth.uid()) with check (viewer_id = auth.uid());
revoke all on public.story_views from anon, authenticated;
grant select, insert, update (is_liked) on public.story_views to authenticated;
alter function public.increment_story_view_count() set search_path = public;

-- 10) Akış, keşfet araması ve profil özeti ------------------------------------------------------------------
create or replace function public.social_post_rows(p_ids uuid[])
returns table (
    id uuid, user_id uuid, content text, media_urls text[], is_video boolean, tagged_pets jsonb, location_text text,
    topic text, comment_privacy text, likes_count integer, comments_count integer, created_at timestamptz, edited_at timestamptz,
    author_name text, author_username text, author_avatar text, author_is_business boolean,
    is_liked boolean, is_saved boolean, is_mine boolean, follows_author boolean)
language sql stable security invoker set search_path = public as $$
    select p.id, p.user_id, p.content, p.media_urls, coalesce(p.is_video, false),
           coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'breed', c.breed, 'type', c.type, 'avatar', c.avatar_url))
                     from pet_cards c where c.id = any(p.tagged_pet_ids)), '[]'::jsonb),
           p.location_text, p.topic, p.comment_privacy, coalesce(p.likes_count, 0), coalesce(p.comments_count, 0), p.created_at, p.edited_at,
           coalesce(nullif(case when pc.role = 'business' then pc.business_name end, ''), pc.full_name, pc.username, 'Moffi üyesi'),
           pc.username, pc.avatar_url, coalesce(pc.role = 'business', false),
           exists (select 1 from likes l where l.post_id = p.id and l.user_id = auth.uid()),
           exists (select 1 from post_saves s where s.post_id = p.id and s.user_id = auth.uid()),
           coalesce(p.user_id = auth.uid(), false),
           exists (select 1 from follows f where f.follower_id = auth.uid() and f.following_id = p.user_id)
    from posts p left join profile_cards pc on pc.id = p.user_id
    where p.id = any(p_ids) and coalesce(pc.account_status, 'active') <> 'deactivated'
    order by p.created_at desc;
$$;
revoke execute on function public.social_post_rows(uuid[]) from public;
grant execute on function public.social_post_rows(uuid[]) to anon, authenticated;

-- mode: 'following' (takip ettiklerim + kendim) | 'for_you' (herkes)
drop function if exists public.get_social_feed(text, timestamptz, integer);
create or replace function public.get_social_feed(p_mode text, p_before timestamptz, p_limit integer)
returns table (
    id uuid, user_id uuid, content text, media_urls text[], is_video boolean, tagged_pets jsonb, location_text text,
    topic text, comment_privacy text, likes_count integer, comments_count integer, created_at timestamptz, edited_at timestamptz,
    author_name text, author_username text, author_avatar text, author_is_business boolean,
    is_liked boolean, is_saved boolean, is_mine boolean, follows_author boolean)
language sql stable security invoker set search_path = public as $$
    select * from social_post_rows(array(
        select p.id from posts p
        where (p_before is null or p.created_at < p_before)
          and (p_mode <> 'following' or p.user_id = auth.uid()
               or exists (select 1 from follows f where f.follower_id = auth.uid() and f.following_id = p.user_id))
        order by p.created_at desc
        limit least(greatest(coalesce(p_limit, 20), 1), 50)));
$$;
revoke execute on function public.get_social_feed(text, timestamptz, integer) from public;
grant execute on function public.get_social_feed(text, timestamptz, integer) to anon, authenticated;

-- Keşfet ızgarası: filtre 'all' | 'cat' | 'dog' | 'young' | 'funny' | 'training' | 'nearby' | 'other'
create or replace function public.search_social_posts(p_query text, p_filter text, p_lat double precision, p_lng double precision, p_limit integer, p_offset integer)
returns table (id uuid, media_url text, is_video boolean, media_count integer, likes_count integer, comments_count integer)
language sql stable security invoker set search_path = public as $$
    select p.id, p.media_urls[1], coalesce(p.is_video, false), cardinality(p.media_urls), coalesce(p.likes_count, 0), coalesce(p.comments_count, 0)
    from posts p left join profile_cards pc on pc.id = p.user_id
    where coalesce(pc.account_status, 'active') <> 'deactivated'
      and (nullif(trim(coalesce(p_query, '')), '') is null
           or concat_ws(' ', p.content, p.location_text, p.pet_names, pc.full_name, pc.username, pc.business_name) ilike '%' || trim(p_query) || '%')
      and case coalesce(p_filter, 'all')
            when 'cat' then 'cat' = any(p.pet_species)
            when 'dog' then 'dog' = any(p.pet_species)
            when 'other' then 'other' = any(p.pet_species)
            when 'young' then p.has_young_pet
            when 'funny' then p.topic = 'funny'
            when 'training' then p.topic = 'training'
            when 'nearby' then p.area_lat is not null and p_lat is not null and km_between(p_lat, p_lng, p.area_lat, p.area_lng) <= 10
            else true end
    order by case when coalesce(p_filter, 'all') = 'all' and nullif(trim(coalesce(p_query, '')), '') is null
                  then coalesce(p.likes_count, 0) * 2 + coalesce(p.comments_count, 0) * 3 - extract(epoch from (now() - p.created_at)) / 86400 else 0 end desc,
             p.created_at desc
    limit least(greatest(coalesce(p_limit, 30), 1), 60) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke execute on function public.search_social_posts(text, text, double precision, double precision, integer, integer) from public;
grant execute on function public.search_social_posts(text, text, double precision, double precision, integer, integer) to anon, authenticated;

create or replace function public.get_profile_summary(p_user uuid)
returns table (posts integer, followers integer, following integer, is_following boolean, follows_me boolean, blocked_by_me boolean)
language sql stable security definer set search_path = public as $$
    select case when is_blocked_between(p_user) and p_user <> coalesce(auth.uid(), p_user) then 0 else
               (select count(*)::integer from posts where user_id = p_user and (show_on_profile or user_id = auth.uid())) end,
           (select count(*)::integer from follows where following_id = p_user),
           (select count(*)::integer from follows where follower_id = p_user),
           exists (select 1 from follows where follower_id = auth.uid() and following_id = p_user),
           exists (select 1 from follows where follower_id = p_user and following_id = auth.uid()),
           exists (select 1 from blocks where blocker_id = auth.uid() and blocked_id = p_user);
$$;
revoke execute on function public.get_profile_summary(uuid) from public;
grant execute on function public.get_profile_summary(uuid) to anon, authenticated;

-- Profil ızgarası: kendi profilinde hepsi, başkasınınkinde "profilimde göster" açık olanlar
create or replace function public.get_profile_posts(p_user uuid, p_saved boolean)
returns table (id uuid, media_url text, is_video boolean, media_count integer, likes_count integer, comments_count integer)
language sql stable security invoker set search_path = public as $$
    select p.id, p.media_urls[1], coalesce(p.is_video, false), cardinality(p.media_urls), coalesce(p.likes_count, 0), coalesce(p.comments_count, 0)
    from posts p
    where case when coalesce(p_saved, false)
               then p_user = auth.uid() and exists (select 1 from post_saves s where s.post_id = p.id and s.user_id = auth.uid())
               else p.user_id = p_user and (p.show_on_profile or p.user_id = auth.uid()) end
    order by p.created_at desc limit 300;
$$;
revoke execute on function public.get_profile_posts(uuid, boolean) from public;
grant execute on function public.get_profile_posts(uuid, boolean) to anon, authenticated;

-- Akış fonksiyonu hesapsız ziyaretçide de "kaydedildi mi" sorar; kural gereği boş döner.
-- (Canlıda ayrı migration: social_explore_anon_saves)
grant select on public.post_saves to anon;
