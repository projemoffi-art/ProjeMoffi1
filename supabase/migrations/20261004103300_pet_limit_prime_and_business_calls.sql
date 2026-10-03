-- 1) Hayvan sınırı (Baran, 2026-10-04): ücretsiz hesapta 5, Prime'da 15. PawCoin artık hesap başına olduğu için (20261004103000)
--    sınır ekonomi değil maliyet/ürün kararıdır. Prime bitince fazladan hayvanlar silinmez; yalnızca yenisi eklenemez.
-- 2) İşletme "telefonla aranabilir" ayarı (varsayılan açık). Kapalıysa müşteriye görünen business_cards telefonu hiç döndürmez
--    (gizleme sunucuda; ekip üyesi ve yönetici yine görür). Ayar profil ekranından, businesses.accepts_calls.

create or replace function public.pet_limit_for(p_user uuid) returns integer
language sql stable security definer set search_path to 'public' as $$
    select case when has_prime(p_user) then 15 else 5 end
$$;
revoke execute on function public.pet_limit_for(uuid) from public, anon;
grant execute on function public.pet_limit_for(uuid) to authenticated;

create or replace function public.pets_limit_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_limit int;
begin
    if tg_op = 'UPDATE' and new.owner_id is not distinct from old.owner_id then return new; end if;
    v_limit := pet_limit_for(new.owner_id);
    if (select count(*) from pets where owner_id = new.owner_id and id <> new.id) >= v_limit then
        raise exception '%', case when v_limit < 15
            then 'Ücretsiz hesapta en çok 5 hayvan ekleyebilirsin. Prime ile 15 hayvana kadar ekleyebilirsin.'
            else 'Bir hesapta en çok 15 hayvan olabilir.' end
            using errcode = 'P0001';
    end if;
    return new;
end $$;
revoke execute on function public.pets_limit_guard() from public, anon, authenticated;

alter table public.businesses add column if not exists accepts_calls boolean not null default true;
grant update (accepts_calls) on public.businesses to authenticated;

create or replace view public.business_cards as
 select b.id,
    (b.business_type)::text as business_type,
    (b.name)::text as name,
    b.approved,
    b.description,
    b.logo_url,
    b.cover_url,
    b.gallery_urls,
    case when b.accepts_calls or is_business_member(b.id) or get_my_role() = 'admin' then (b.phone)::text end as phone,
    b.website,
    b.address,
    b.province,
    b.district,
    (b.lat)::double precision as lat,
    (b.lng)::double precision as lng,
    b.working_hours,
    b.cancellation_notice_hours,
    b.created_at,
    b.accepts_calls
   from businesses b
  where (b.approved or is_business_member(b.id) or (get_my_role() = 'admin'::text));
