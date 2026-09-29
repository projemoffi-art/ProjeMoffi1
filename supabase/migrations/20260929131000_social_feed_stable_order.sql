-- Dış sorguda sıralama yoktu: seçilen gönderiler karışık sırayla dönüyor, "daha eski" sayfalaması gönderi atlayabiliyordu.
create or replace function public.get_social_feed(p_mode text, p_before timestamp with time zone, p_limit integer)
 returns table(id uuid, user_id uuid, content text, media_urls text[], is_video boolean, tagged_pets jsonb, location_text text, topic text, comment_privacy text, likes_count integer, comments_count integer, created_at timestamp with time zone, edited_at timestamp with time zone, author_name text, author_username text, author_avatar text, author_is_business boolean, is_liked boolean, is_saved boolean, is_mine boolean, follows_author boolean)
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
