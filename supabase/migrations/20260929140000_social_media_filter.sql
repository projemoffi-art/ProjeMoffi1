-- Video gönderilerinde efekt: fotoğraflarda filtre dosyaya işlenir; videoda tarayıcıda yeniden kodlamak ağır ve
-- güvenilmez olduğu için filtre adı saklanır, oynatılırken uygulanır. Sadece bilinen filtre adları kabul edilir.
alter table public.posts add column if not exists media_filter text;
alter table public.posts drop constraint if exists posts_media_filter_known;
alter table public.posts add constraint posts_media_filter_known check (media_filter is null or media_filter in
    ('bright', 'vivid', 'warm', 'cool', 'faded', 'cream', 'pastel', 'dusty', 'minimal', 'mono', 'noir', 'vintage', 'nostalgia', 'cinema'));
grant select (media_filter) on public.posts to anon, authenticated;
grant insert (media_filter) on public.posts to authenticated;

create or replace function public.posts_guard()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
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
    if not coalesce(new.is_video, false) then new.media_filter := null; end if;
    new.allow_comments := coalesce(new.comment_privacy, 'everyone') <> 'nobody';
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
$function$;

drop function if exists public.get_social_feed(text, timestamptz, integer);
drop function if exists public.social_post_rows(uuid[]);
drop function if exists public.search_social_posts(text, text, double precision, double precision, integer, integer);
drop function if exists public.get_profile_posts(uuid, boolean);

create function public.social_post_rows(p_ids uuid[])
 returns table(id uuid, user_id uuid, content text, media_urls text[], is_video boolean, tagged_pets jsonb, location_text text, topic text, comment_privacy text, likes_count integer, comments_count integer, created_at timestamp with time zone, edited_at timestamp with time zone, author_name text, author_username text, author_avatar text, author_is_business boolean, is_liked boolean, is_saved boolean, is_mine boolean, follows_author boolean, media_filter text)
 language sql stable
 set search_path to 'public'
as $function$
    select p.id, p.user_id, p.content, p.media_urls, coalesce(p.is_video, false),
           coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'breed', c.breed, 'type', c.type, 'avatar', c.avatar_url))
                     from pet_cards c where c.id = any(p.tagged_pet_ids)), '[]'::jsonb),
           p.location_text, p.topic, p.comment_privacy, coalesce(p.likes_count, 0), coalesce(p.comments_count, 0), p.created_at, p.edited_at,
           coalesce(nullif(case when pc.role = 'business' then pc.business_name end, ''), pc.full_name, pc.username, 'Moffi üyesi'),
           pc.username, pc.avatar_url, coalesce(pc.role = 'business', false),
           exists (select 1 from likes l where l.post_id = p.id and l.user_id = auth.uid()),
           exists (select 1 from post_saves s where s.post_id = p.id and s.user_id = auth.uid()),
           coalesce(p.user_id = auth.uid(), false),
           exists (select 1 from follows f where f.follower_id = auth.uid() and f.following_id = p.user_id),
           p.media_filter
    from posts p left join profile_cards pc on pc.id = p.user_id
    where p.id = any(p_ids) and coalesce(pc.account_status, 'active') <> 'deactivated'
    order by p.created_at desc;
$function$;

create function public.get_social_feed(p_mode text, p_before timestamp with time zone, p_limit integer)
 returns table(id uuid, user_id uuid, content text, media_urls text[], is_video boolean, tagged_pets jsonb, location_text text, topic text, comment_privacy text, likes_count integer, comments_count integer, created_at timestamp with time zone, edited_at timestamp with time zone, author_name text, author_username text, author_avatar text, author_is_business boolean, is_liked boolean, is_saved boolean, is_mine boolean, follows_author boolean, media_filter text)
 language sql stable
 set search_path to 'public'
as $function$
    select r.* from social_post_rows(array(
        select p.id from posts p
        where (p_before is null or p.created_at < p_before)
          and (p_mode <> 'following' or p.user_id = auth.uid()
               or exists (select 1 from follows f where f.follower_id = auth.uid() and f.following_id = p.user_id))
        order by p.created_at desc
        limit least(greatest(coalesce(p_limit, 20), 1), 50))) r
    order by r.created_at desc, r.id desc;
$function$;

create function public.search_social_posts(p_query text, p_filter text, p_lat double precision, p_lng double precision, p_limit integer, p_offset integer)
 returns table(id uuid, media_url text, is_video boolean, media_count integer, likes_count integer, comments_count integer, media_filter text)
 language sql stable
 set search_path to 'public'
as $function$
    select p.id, p.media_urls[1], coalesce(p.is_video, false), cardinality(p.media_urls), coalesce(p.likes_count, 0), coalesce(p.comments_count, 0), p.media_filter
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
$function$;

create function public.get_profile_posts(p_user uuid, p_saved boolean)
 returns table(id uuid, media_url text, is_video boolean, media_count integer, likes_count integer, comments_count integer, media_filter text)
 language sql stable
 set search_path to 'public'
as $function$
    select p.id, p.media_urls[1], coalesce(p.is_video, false), cardinality(p.media_urls), coalesce(p.likes_count, 0), coalesce(p.comments_count, 0), p.media_filter
    from posts p
    where case when coalesce(p_saved, false)
               then p_user = auth.uid() and exists (select 1 from post_saves s where s.post_id = p.id and s.user_id = auth.uid())
               else p.user_id = p_user and (p.show_on_profile or p.user_id = auth.uid()) end
    order by p.created_at desc limit 300;
$function$;

revoke all on function public.social_post_rows(uuid[]) from public;
revoke all on function public.get_social_feed(text, timestamptz, integer) from public;
revoke all on function public.search_social_posts(text, text, double precision, double precision, integer, integer) from public;
revoke all on function public.get_profile_posts(uuid, boolean) from public;
grant execute on function public.social_post_rows(uuid[]) to anon, authenticated;
grant execute on function public.get_social_feed(text, timestamptz, integer) to anon, authenticated;
grant execute on function public.search_social_posts(text, text, double precision, double precision, integer, integer) to anon, authenticated;
grant execute on function public.get_profile_posts(uuid, boolean) to anon, authenticated;
