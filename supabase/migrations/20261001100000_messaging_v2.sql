-- Mesajlaşma v2: yazma yalnızca sunucu fonksiyonlarıyla; çift başına tek sohbet; engel, uzunluk ve hız sınırı sunucuda;
-- yanıt, emoji tepkisi, sessize alma / kendinden temizleme; mesaj fotoğrafları özel alanda.
-- Kapatılan açıklar: gönderen alanı boş mesaj eklenebiliyordu (giriş yapmadan da), katılımcısı olmadığın sohbete
-- yazılabiliyordu, karşı taraf senin mesajının metnini değiştirebiliyordu, katılımcı sohbetin sahiplerini değiştirebiliyordu,
-- gelen kutusu önizlemesini istemci yazıyordu.

-- 1) Eski kayıtların alıcısı (Realtime ve yeni okuma kuralı alıcı kolonuna bakar)
update public.messages m
   set receiver_id = case when m.sender_id = c.participant_1 then c.participant_2 else c.participant_1 end
  from public.conversations c
 where c.id = m.conversation_id
   and c.participant_1 <> c.participant_2
   and m.receiver_id is distinct from (case when m.sender_id = c.participant_1 then c.participant_2 else c.participant_1 end);

-- 2) Yapı
alter table public.messages add column if not exists reply_to uuid references public.messages(id) on delete set null;
alter table public.messages drop constraint if exists messages_content_length;
alter table public.messages add constraint messages_content_length check (char_length(coalesce(content, '')) <= 2000) not valid;
alter table public.conversations drop constraint if exists conversations_distinct_participants;
alter table public.conversations add constraint conversations_distinct_participants check (participant_1 <> participant_2) not valid;
create unique index if not exists conversations_one_per_pair
    on public.conversations (least(participant_1, participant_2), greatest(participant_1, participant_2), (context_type = 'clinic'))
    where participant_1 <> participant_2;
create index if not exists messages_conversation_created on public.messages (conversation_id, created_at desc);
create index if not exists messages_receiver_unread on public.messages (receiver_id) where is_read = false;

create table if not exists public.message_reactions (
    message_id uuid not null references public.messages(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    peer_id uuid not null references auth.users(id) on delete cascade,
    emoji text not null check (emoji in ('❤️', '😂', '😮', '😢', '👍', '🐾')),
    created_at timestamptz not null default now(),
    primary key (message_id, user_id)
);
alter table public.message_reactions enable row level security;
drop policy if exists "Reactions: participants read" on public.message_reactions;
create policy "Reactions: participants read" on public.message_reactions for select to authenticated
    using (user_id = auth.uid() or peer_id = auth.uid());
grant select on public.message_reactions to authenticated;

create table if not exists public.conversation_prefs (
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    muted boolean not null default false,
    cleared_at timestamptz,
    primary key (conversation_id, user_id)
);
alter table public.conversation_prefs enable row level security;
drop policy if exists "Conversation prefs: own" on public.conversation_prefs;
create policy "Conversation prefs: own" on public.conversation_prefs for select to authenticated using (user_id = auth.uid());
grant select on public.conversation_prefs to authenticated;

-- 3) Yetkiler ve okuma kuralları (tek tablo, tek kolon — Realtime'ın güvenilir değerlendirdiği tür)
revoke all on public.conversations from anon;
revoke all on public.messages from anon;
revoke insert, update, delete, truncate, references, trigger on public.conversations from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.messages from authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;

drop policy if exists "Allow insert for participants for conversations" on public.conversations;
drop policy if exists "Allow update for participants for conversations" on public.conversations;
drop policy if exists "Allow select for participants for conversations" on public.conversations;
create policy "Conversations: participants read" on public.conversations for select to authenticated
    using (participant_1 = auth.uid() or participant_2 = auth.uid());

drop policy if exists "Allow insert for sender for messages" on public.messages;
drop policy if exists "Allow update for participants for messages" on public.messages;
drop policy if exists "Allow select for participants for messages" on public.messages;
create policy "Messages: sender or receiver read" on public.messages for select to authenticated
    using (sender_id = auth.uid() or receiver_id = auth.uid());

-- 4) Gelen kutusu önizlemesi sunucuda
create or replace function public.messages_sync_conversation()
 returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
    if tg_op = 'INSERT' then
        update conversations
           set last_message = case when coalesce(new.content, '') <> '' then left(new.content, 200) when new.attachment_url is not null then '📷 Fotoğraf' else '' end,
               last_message_at = new.created_at
         where id = new.conversation_id;
    elsif new.is_deleted and not old.is_deleted then
        update conversations c set last_message = 'Mesaj geri alındı'
         where c.id = new.conversation_id
           and not exists (select 1 from messages m where m.conversation_id = new.conversation_id and m.created_at > new.created_at);
    end if;
    return new;
end;
$$;
drop trigger if exists messages_sync_conversation on public.messages;
create trigger messages_sync_conversation after insert or update of is_deleted on public.messages
    for each row execute function public.messages_sync_conversation();
revoke all on function public.messages_sync_conversation() from public;

-- 5) Sunucu fonksiyonları
create or replace function public.chat_conversation_for(p_other uuid, p_clinic boolean)
 returns uuid language sql stable security definer set search_path to 'public'
as $$
    select id from conversations
     where least(participant_1, participant_2) = least(auth.uid(), p_other)
       and greatest(participant_1, participant_2) = greatest(auth.uid(), p_other)
       and (context_type = 'clinic') = coalesce(p_clinic, false)
     limit 1;
$$;
revoke all on function public.chat_conversation_for(uuid, boolean) from public;

create or replace function public.send_chat_message(
    p_receiver uuid, p_content text, p_attachment text default null, p_clinic boolean default false,
    p_ad uuid default null, p_reply_to uuid default null)
 returns table(id uuid, created_at timestamptz, conversation_id uuid)
 language plpgsql security definer set search_path to 'public'
as $$
#variable_conflict use_column
declare
    v_me uuid := auth.uid();
    v_conv uuid;
    v_text text := btrim(coalesce(p_content, ''));
    v_id uuid;
    v_at timestamptz;
begin
    if v_me is null then raise exception 'Mesaj göndermek için giriş yapmalısın.'; end if;
    if p_receiver is null or p_receiver = v_me then raise exception 'Kendine mesaj gönderemezsin.'; end if;
    if not exists (select 1 from profiles where profiles.id = p_receiver and coalesce(account_status, 'active') <> 'deactivated') then
        raise exception 'Bu hesaba mesaj gönderilemiyor.';
    end if;
    if exists (select 1 from blocks b where (b.blocker_id = v_me and b.blocked_id = p_receiver) or (b.blocker_id = p_receiver and b.blocked_id = v_me)) then
        raise exception 'Bu kişiyle mesajlaşamazsın.';
    end if;
    if v_text = '' and p_attachment is null then raise exception 'Boş mesaj gönderilemez.'; end if;
    if char_length(v_text) > 2000 then raise exception 'Mesaj en fazla 2000 karakter olabilir.'; end if;
    if p_attachment is not null and not (
        p_attachment like 'chat-media/' || v_me::text || '/%'
        or p_attachment like '%/storage/v1/object/public/%') then
        raise exception 'Geçersiz ek.';
    end if;
    if (select count(*) from messages m where m.sender_id = v_me and m.created_at > now() - interval '1 minute') >= 30 then
        raise exception 'Çok hızlı mesaj gönderiyorsun, biraz bekle.';
    end if;

    v_conv := chat_conversation_for(p_receiver, p_clinic);
    if v_conv is null then
        insert into conversations (participant_1, participant_2, context_type, associated_ad_id)
        values (v_me, p_receiver, case when p_clinic then 'clinic' when p_ad is not null then 'lost_pet' else 'general' end, p_ad)
        on conflict do nothing
        returning conversations.id into v_conv;
        if v_conv is null then v_conv := chat_conversation_for(p_receiver, p_clinic); end if;
    elsif p_ad is not null then
        update conversations set associated_ad_id = p_ad where conversations.id = v_conv and associated_ad_id is null;
    end if;

    if p_reply_to is not null and not exists (select 1 from messages m where m.id = p_reply_to and m.conversation_id = v_conv) then
        p_reply_to := null;
    end if;

    insert into messages (conversation_id, sender_id, receiver_id, content, attachment_url, reply_to)
    values (v_conv, v_me, p_receiver, v_text, p_attachment, p_reply_to)
    returning messages.id, messages.created_at into v_id, v_at;

    return query select v_id, v_at, v_conv;
end;
$$;
revoke all on function public.send_chat_message(uuid, text, text, boolean, uuid, uuid) from public;
grant execute on function public.send_chat_message(uuid, text, text, boolean, uuid, uuid) to authenticated;

create or replace function public.mark_chat_read(p_other uuid, p_clinic boolean default false)
 returns integer language plpgsql security definer set search_path to 'public'
as $$
declare v_n integer;
begin
    if auth.uid() is null then return 0; end if;
    update messages set is_read = true
     where receiver_id = auth.uid() and sender_id = p_other and is_read = false
       and conversation_id = chat_conversation_for(p_other, p_clinic);
    get diagnostics v_n = row_count;
    return v_n;
end;
$$;
revoke all on function public.mark_chat_read(uuid, boolean) from public;
grant execute on function public.mark_chat_read(uuid, boolean) to authenticated;

create or replace function public.recall_chat_message(p_id uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $$
begin
    update messages set is_deleted = true, content = '', attachment_url = null
     where id = p_id and sender_id = auth.uid() and not coalesce(is_deleted, false);
    if not found then raise exception 'Bu mesaj geri alınamaz.'; end if;
    delete from message_reactions where message_id = p_id;
end;
$$;
revoke all on function public.recall_chat_message(uuid) from public;
grant execute on function public.recall_chat_message(uuid) to authenticated;

create or replace function public.toggle_message_reaction(p_message uuid, p_emoji text)
 returns text language plpgsql security definer set search_path to 'public'
as $$
declare v_m messages; v_peer uuid; v_current text;
begin
    select * into v_m from messages where id = p_message;
    if v_m.id is null or auth.uid() not in (v_m.sender_id, v_m.receiver_id) or coalesce(v_m.is_deleted, false) then
        raise exception 'Bu mesaja tepki verilemez.';
    end if;
    if p_emoji not in ('❤️', '😂', '😮', '😢', '👍', '🐾') then raise exception 'Geçersiz tepki.'; end if;
    v_peer := case when v_m.sender_id = auth.uid() then v_m.receiver_id else v_m.sender_id end;
    select emoji into v_current from message_reactions where message_id = p_message and user_id = auth.uid();
    if v_current = p_emoji then
        delete from message_reactions where message_id = p_message and user_id = auth.uid();
        return null;
    end if;
    insert into message_reactions (message_id, user_id, peer_id, emoji) values (p_message, auth.uid(), v_peer, p_emoji)
    on conflict (message_id, user_id) do update set emoji = excluded.emoji, created_at = now();
    return p_emoji;
end;
$$;
revoke all on function public.toggle_message_reaction(uuid, text) from public;
grant execute on function public.toggle_message_reaction(uuid, text) to authenticated;

create or replace function public.set_conversation_pref(p_other uuid, p_muted boolean default null, p_clear boolean default false, p_clinic boolean default false)
 returns void language plpgsql security definer set search_path to 'public'
as $$
declare v_conv uuid := chat_conversation_for(p_other, p_clinic);
begin
    if auth.uid() is null or v_conv is null then raise exception 'Sohbet bulunamadı.'; end if;
    insert into conversation_prefs (conversation_id, user_id, muted, cleared_at)
    values (v_conv, auth.uid(), coalesce(p_muted, false), case when p_clear then now() end)
    on conflict (conversation_id, user_id) do update
       set muted = coalesce(p_muted, conversation_prefs.muted),
           cleared_at = case when p_clear then now() else conversation_prefs.cleared_at end;
end;
$$;
revoke all on function public.set_conversation_pref(uuid, boolean, boolean, boolean) from public;
grant execute on function public.set_conversation_pref(uuid, boolean, boolean, boolean) to authenticated;

-- 6) Realtime
do $$ begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'message_reactions') then
        alter publication supabase_realtime add table public.message_reactions;
    end if;
end $$;

-- 7) Mesaj fotoğrafları: özel alan. Yol: <gönderen>/<dosya>. Sadece yükleyen ve o fotoğrafın gönderildiği mesajın alıcısı görür.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Chat media: sender uploads" on storage.objects;
create policy "Chat media: sender uploads" on storage.objects for insert to authenticated
    with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Chat media: participants read" on storage.objects;
create policy "Chat media: participants read" on storage.objects for select to authenticated
    using (bucket_id = 'chat-media' and (
        (storage.foldername(name))[1] = auth.uid()::text
        or exists (select 1 from public.messages m where m.attachment_url = 'chat-media/' || name and m.receiver_id = auth.uid())));
drop policy if exists "Chat media: sender deletes" on storage.objects;
create policy "Chat media: sender deletes" on storage.objects for delete to authenticated
    using (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);
