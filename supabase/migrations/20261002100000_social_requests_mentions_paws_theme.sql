-- Faz 2 (yol haritası 8.52): mesaj istekleri, @bahsetme bildirimi, pati tepkisi, haftanın teması.

-- 1) Mesaj istekleri ---------------------------------------------------------------------------------
-- Tanımadığın birinden (onu takip etmiyorsun, ona hiç yazmadın, aranızda randevu/sahiplendirme yok) gelen
-- genel sohbet "istek" olarak ayrı kutuya düşer. Kabul edene ya da yanıt verene kadar okundu bilgisi gitmez.
alter table public.conversation_prefs add column if not exists accepted_at timestamptz;

create or replace function public.chat_is_request(p_conv uuid, p_me uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
    select coalesce((
        select c.context_type = 'general'
           and not exists (select 1 from messages m where m.sender_id = p_me
                             and m.receiver_id = case when c.participant_1 = p_me then c.participant_2 else c.participant_1 end)
           and not exists (select 1 from follows f where f.follower_id = p_me
                             and f.following_id = case when c.participant_1 = p_me then c.participant_2 else c.participant_1 end)
           and not exists (select 1 from conversation_prefs cp join conversations c2 on c2.id = cp.conversation_id
                            where cp.user_id = p_me and cp.accepted_at is not null
                              and least(c2.participant_1, c2.participant_2) = least(c.participant_1, c.participant_2)
                              and greatest(c2.participant_1, c2.participant_2) = greatest(c.participant_1, c.participant_2))
           and not exists (select 1 from adoption_applications a
                            where (a.applicant_id = c.participant_1 and a.owner_id = c.participant_2)
                               or (a.applicant_id = c.participant_2 and a.owner_id = c.participant_1))
           and not exists (select 1 from appointments ap
                            where (ap.user_id = c.participant_1 and ap.clinic_id = c.participant_2)
                               or (ap.user_id = c.participant_2 and ap.clinic_id = c.participant_1))
        from conversations c
        where c.id = p_conv and p_me in (c.participant_1, c.participant_2)), false);
$$;
revoke all on function public.chat_is_request(uuid, uuid) from public;

create or replace function public.get_chat_request_ids()
returns setof uuid language sql stable security definer set search_path to 'public' as $$
    select c.id from conversations c
     where auth.uid() in (c.participant_1, c.participant_2) and c.context_type = 'general'
       and chat_is_request(c.id, auth.uid());
$$;
revoke all on function public.get_chat_request_ids() from public;
grant execute on function public.get_chat_request_ids() to authenticated;

create or replace function public.accept_chat_request(p_other uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    if auth.uid() is null then raise exception 'Giriş yapmalısın.'; end if;
    insert into conversation_prefs (conversation_id, user_id, accepted_at)
    select c.id, auth.uid(), now() from conversations c
     where least(c.participant_1, c.participant_2) = least(auth.uid(), p_other)
       and greatest(c.participant_1, c.participant_2) = greatest(auth.uid(), p_other)
       and c.context_type <> 'clinic'
    on conflict (conversation_id, user_id) do update set accepted_at = coalesce(conversation_prefs.accepted_at, now());
end;
$$;
revoke all on function public.accept_chat_request(uuid) from public;
grant execute on function public.accept_chat_request(uuid) to authenticated;

-- İstek açıkken okundu bilgisi gönderilmez.
create or replace function public.mark_chat_read(p_other uuid, p_clinic boolean default false)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_n integer; v_conv uuid;
begin
    if auth.uid() is null then return 0; end if;
    v_conv := chat_conversation_for(p_other, p_clinic);
    if v_conv is null or chat_is_request(v_conv, auth.uid()) then return 0; end if;
    update messages set is_read = true
     where receiver_id = auth.uid() and sender_id = p_other and is_read = false and conversation_id = v_conv;
    get diagnostics v_n = row_count;
    return v_n;
end;
$$;
revoke all on function public.mark_chat_read(uuid, boolean) from public;
grant execute on function public.mark_chat_read(uuid, boolean) to authenticated;

-- 2) @bahsetme bildirimi -------------------------------------------------------------------------------
-- Gönderi ve yorumdaki @kullanıcıadı'na bildirim. Aynı kaynakta aynı kişiye bir kez (düzenlemede tekrar gitmez).
create table if not exists public.social_mentions (
    source_kind text not null check (source_kind in ('post', 'comment')),
    source_id uuid not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (source_kind, source_id, user_id)
);
alter table public.social_mentions enable row level security;
revoke all on public.social_mentions from anon, authenticated;

create or replace function public.notify_mentions(p_kind text, p_source uuid, p_post uuid, p_author uuid, p_text text, p_skip uuid[])
returns void language plpgsql security definer set search_path to 'public' as $$
declare r record; v_target uuid; v_name text; v_n int := 0;
begin
    if coalesce(p_text, '') !~ '@' then return; end if;
    select coalesce(nullif(case when role = 'business' then business_name end, ''), full_name, username, 'Biri') into v_name
      from profiles where id = p_author;
    for r in select distinct lower(m[1]) as uname from regexp_matches(p_text, '@([[:alnum:]_]{2,40})', 'g') m loop
        exit when v_n >= 10;
        select id into v_target from profiles
         where lower(username) = r.uname and coalesce(account_status, 'active') <> 'deactivated';
        continue when v_target is null or v_target = p_author or v_target = any(coalesce(p_skip, '{}'));
        continue when exists (select 1 from blocks b where (b.blocker_id = v_target and b.blocked_id = p_author)
                                                     or (b.blocker_id = p_author and b.blocked_id = v_target));
        insert into social_mentions (source_kind, source_id, user_id) values (p_kind, p_source, v_target) on conflict do nothing;
        if found then
            v_n := v_n + 1;
            perform notify_user(v_target, 'mention',
                v_name || case when p_kind = 'post' then ' bir gönderide senden bahsetti.' else ' bir yorumda senden bahsetti.' end,
                left(p_text, 140), p_author, p_post::text);
        end if;
    end loop;
end;
$$;
revoke all on function public.notify_mentions(text, uuid, uuid, uuid, text, uuid[]) from public;

create or replace function public.trigger_notify_post_mentions()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
    if tg_op = 'INSERT' or new.content is distinct from old.content then
        perform notify_mentions('post', new.id, new.id, new.user_id, new.content, null);
    end if;
    return new;
end;
$$;
revoke all on function public.trigger_notify_post_mentions() from public;
drop trigger if exists on_post_mentions on public.posts;
create trigger on_post_mentions after insert or update of content on public.posts
    for each row execute function public.trigger_notify_post_mentions();

-- Yorum bildirimi + yorumdaki bahsetmeler. Zaten "yorum/yanıt" bildirimi alan kişiye ayrıca bahsetme gitmez.
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
    perform notify_mentions('comment', new.id, new.post_id, new.user_id, new.content,
        array_remove(array[v_owner, v_parent_user], null));
    return new;
end;
$$;

-- 3) Pati tepkisi -------------------------------------------------------------------------------------
-- Beğeniden ayrı, Moffi'ye özgü tek tepki. Sadece sunucu fonksiyonuyla verilir/geri alınır.
alter table public.posts add column if not exists paws_count integer not null default 0;

create table if not exists public.post_paws (
    post_id uuid not null references public.posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (post_id, user_id)
);
create index if not exists post_paws_user_idx on public.post_paws (user_id);
alter table public.post_paws enable row level security;
drop policy if exists "Post paws: read" on public.post_paws;
create policy "Post paws: read" on public.post_paws for select using (true);
revoke all on public.post_paws from anon, authenticated;
grant select on public.post_paws to anon, authenticated;

create or replace function public.toggle_post_paw(p_post uuid)
returns table (pawed boolean, paws_count integer)
language plpgsql security definer set search_path to 'public' as $$
#variable_conflict use_column
declare v_me uuid := auth.uid(); v_owner uuid; v_name text; v_on boolean;
begin
    if v_me is null then raise exception 'Pati bırakmak için giriş yapmalısın.'; end if;
    select user_id into v_owner from posts where id = p_post;
    if v_owner is null then raise exception 'Gönderi bulunamadı.'; end if;
    if exists (select 1 from blocks b where (b.blocker_id = v_me and b.blocked_id = v_owner) or (b.blocker_id = v_owner and b.blocked_id = v_me)) then
        raise exception 'Bu gönderiye tepki veremezsin.';
    end if;
    delete from post_paws where post_id = p_post and user_id = v_me;
    if found then
        v_on := false;
        delete from notifications where type = 'paw' and actor_id = v_me and entity_id = p_post::text;
    else
        insert into post_paws (post_id, user_id) values (p_post, v_me);
        v_on := true;
        if v_owner <> v_me then
            select coalesce(nullif(case when role = 'business' then business_name end, ''), full_name, username, 'Biri') into v_name from profiles where id = v_me;
            delete from notifications where user_id = v_owner and actor_id = v_me and type = 'paw' and entity_id = p_post::text;
            perform notify_user(v_owner, 'paw', v_name || ' gönderine pati bıraktı.', '🐾', v_me, p_post::text);
        end if;
    end if;
    update posts set paws_count = (select count(*) from post_paws pp where pp.post_id = p_post) where id = p_post;
    return query select v_on, (select p.paws_count from posts p where p.id = p_post);
end;
$$;
revoke all on function public.toggle_post_paw(uuid) from public;
grant execute on function public.toggle_post_paw(uuid) to authenticated;

create or replace function public.post_paw_state(p_ids uuid[])
returns table (post_id uuid, paws_count integer, is_pawed boolean)
language sql stable security invoker set search_path to 'public' as $$
    select p.id, coalesce(p.paws_count, 0),
           exists (select 1 from post_paws pp where pp.post_id = p.id and pp.user_id = auth.uid())
      from posts p where p.id = any(p_ids);
$$;
revoke all on function public.post_paw_state(uuid[]) from public;
grant execute on function public.post_paw_state(uuid[]) to anon, authenticated;

-- 4) Haftanın teması ----------------------------------------------------------------------------------
-- Yönetici bir etiket ve tarih aralığı girer. O hafta etiketle ilk paylaşımında kişi bir kez puan kazanır.
create table if not exists public.weekly_themes (
    id uuid primary key default gen_random_uuid(),
    hashtag text not null check (hashtag ~ '^[[:alnum:]_]{2,30}$'),
    title text not null check (char_length(title) between 2 and 60),
    description text check (char_length(coalesce(description, '')) <= 280),
    starts_on date not null,
    ends_on date not null,
    reward_points integer not null default 50 check (reward_points between 0 and 200),
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    check (ends_on >= starts_on and ends_on - starts_on <= 13)
);
create index if not exists weekly_themes_dates_idx on public.weekly_themes (starts_on, ends_on);
alter table public.weekly_themes enable row level security;
drop policy if exists "Weekly themes: read" on public.weekly_themes;
drop policy if exists "Weekly themes: admin write" on public.weekly_themes;
create policy "Weekly themes: read" on public.weekly_themes for select using (true);
create policy "Weekly themes: admin write" on public.weekly_themes for all to authenticated
    using (get_my_role() = 'admin') with check (get_my_role() = 'admin');
revoke all on public.weekly_themes from anon, authenticated;
grant select on public.weekly_themes to anon, authenticated;
grant insert, update, delete on public.weekly_themes to authenticated;

-- Aynı günlere iki tema girilemez.
create or replace function public.weekly_themes_no_overlap()
returns trigger language plpgsql set search_path to 'public' as $$
begin
    new.hashtag := regexp_replace(new.hashtag, '^#', '');
    if exists (select 1 from weekly_themes w where w.id <> new.id
                and daterange(w.starts_on, w.ends_on, '[]') && daterange(new.starts_on, new.ends_on, '[]')) then
        raise exception 'Bu tarihlerde zaten bir tema var.';
    end if;
    if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
    return new;
end;
$$;
drop trigger if exists weekly_themes_no_overlap on public.weekly_themes;
create trigger weekly_themes_no_overlap before insert or update on public.weekly_themes
    for each row execute function public.weekly_themes_no_overlap();

create table if not exists public.theme_participations (
    theme_id uuid not null references public.weekly_themes(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid references public.posts(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (theme_id, user_id)
);
alter table public.theme_participations enable row level security;
drop policy if exists "Theme participations: own" on public.theme_participations;
create policy "Theme participations: own" on public.theme_participations for select to authenticated using (user_id = auth.uid());
revoke all on public.theme_participations from anon, authenticated;
grant select on public.theme_participations to authenticated;

create or replace function public.current_weekly_theme_id()
returns uuid language sql stable security definer set search_path to 'public' as $$
    select id from weekly_themes
     where (now() at time zone 'Europe/Istanbul')::date between starts_on and ends_on
     order by starts_on desc limit 1;
$$;
revoke all on function public.current_weekly_theme_id() from public;

create or replace function public.get_current_theme()
returns table (id uuid, hashtag text, title text, description text, starts_on date, ends_on date,
               reward_points integer, participant_count integer, joined boolean)
language sql stable security definer set search_path to 'public' as $$
    select w.id, w.hashtag, w.title, w.description, w.starts_on, w.ends_on, w.reward_points,
           (select count(*)::int from theme_participations t where t.theme_id = w.id),
           exists (select 1 from theme_participations t where t.theme_id = w.id and t.user_id = auth.uid())
      from weekly_themes w where w.id = current_weekly_theme_id();
$$;
revoke all on function public.get_current_theme() from public;
grant execute on function public.get_current_theme() to anon, authenticated;

create or replace function public.trigger_weekly_theme_participation()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_theme weekly_themes%rowtype;
begin
    select * into v_theme from weekly_themes where id = current_weekly_theme_id();
    if v_theme.id is null then return new; end if;
    if coalesce(new.content, '') !~* ('(^|[^[:alnum:]_])#' || v_theme.hashtag || '($|[^[:alnum:]_])') then return new; end if;
    insert into theme_participations (theme_id, user_id, post_id) values (v_theme.id, new.user_id, new.id)
    on conflict do nothing;
    if found and v_theme.reward_points > 0 then
        perform award_pati_puan_internal(new.user_id, v_theme.reward_points, 'Haftanın teması: #' || v_theme.hashtag, 'quest', v_theme.id::text);
        perform notify_user(new.user_id, 'theme', 'Haftanın temasına katıldın 🎉',
            '#' || v_theme.hashtag || ' paylaşımın için +' || v_theme.reward_points || ' Moffi Puanı kazandın.', null, new.id::text);
    end if;
    return new;
end;
$$;
revoke all on function public.trigger_weekly_theme_participation() from public;
drop trigger if exists on_post_weekly_theme on public.posts;
create trigger on_post_weekly_theme after insert or update of content on public.posts
    for each row execute function public.trigger_weekly_theme_participation();
