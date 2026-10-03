-- Albümden silme (20261004101100'ün devamı). Sıra: istemci önce kendi klasöründeki dosyaları depodan kaldırır
-- (pet_album_owner_remove), sonra remove_pet_media satırı siler. Anı silinince fotoğrafları albümde kalır (memory_id boşalır).
-- remove_stale_pet_media: bir günden eski, onaylanmamış ayırmaların yollarını döndürüp satırları siler; istemci albümü açarken
-- çağırır ve dönen yolları depodan kaldırır (yarım kalmış yüklemeler birikmesin).

create policy pet_album_owner_remove on storage.objects for delete to authenticated
    using (bucket_id = 'pet-album' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.remove_pet_media(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    delete from public.pet_media where id = p_id and owner_id = auth.uid();
    if not found then raise exception 'Dosya bulunamadı' using errcode = '42501'; end if;
end $$;
revoke execute on function public.remove_pet_media(uuid) from public, anon;
grant execute on function public.remove_pet_media(uuid) to authenticated;

create or replace function public.remove_pet_memory(p_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
    delete from public.pet_memories where id = p_id and owner_id = auth.uid();
    if not found then raise exception 'Anı bulunamadı' using errcode = '42501'; end if;
end $$;
revoke execute on function public.remove_pet_memory(uuid) from public, anon;
grant execute on function public.remove_pet_memory(uuid) to authenticated;

create or replace function public.remove_stale_pet_media()
returns text[] language plpgsql security definer set search_path to 'public' as $$
declare
    v_paths text[];
begin
    with gone as (
        delete from public.pet_media
         where owner_id = auth.uid() and status = 'pending' and created_at < now() - interval '1 day'
        returning path, thumb_path
    )
    select coalesce(array_agg(p), '{}') into v_paths
      from (select path as p from gone union all select thumb_path from gone) x;
    return v_paths;
end $$;
revoke execute on function public.remove_stale_pet_media() from public, anon;
grant execute on function public.remove_stale_pet_media() to authenticated;
