-- pets tablosu herkese açık okunuyordu (using (true) ile 5 ayrı kural): sahibin telefonu ve adresi
-- (sos_settings), sağlık notu, çip numarası dahil her şey. Artık:
--   * sahibi her şeyi yönetir,
--   * randevusu olan klinik kendi hastasını okur,
--   * yönetici okur,
--   * başkalarına gereken alanlar (ad, tür, ırk, fotoğraf, seviye, kayıp ilan mesajı) pet_cards görünümünden gelir.

do $$
declare pol record;
begin
    for pol in select polname from pg_policy where polrelid = 'public.pets'::regclass loop
        execute format('drop policy %I on public.pets', pol.polname);
    end loop;
end $$;

alter table public.pets enable row level security;

create policy "Pets: owner manages" on public.pets for all to authenticated
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Pets: clinic reads its patients" on public.pets for select to authenticated
    using (exists (select 1 from public.appointments a where a.pet_id = pets.id and a.clinic_id = auth.uid()));

create policy "Pets: admin reads" on public.pets for select to authenticated
    using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));

revoke all on public.pets from anon, authenticated;
grant select, insert, update, delete on public.pets to authenticated;

-- Herkese açık kart: sadece paylaşılması gereken alanlar. Kayıp ilanı alanları sadece kayıp modunda dolu.
create or replace view public.pet_cards as
select p.id, p.owner_id, p.name, p.type, p.breed, p.gender, p.age, p.size, p.character,
       p.avatar_url, p.cover_url, coalesce(p.is_lost, false) as is_lost, p.xp, p.level,
       p.equipped_apparel, p.avatar_body_color, p.avatar_background, p.created_at,
       case when p.is_lost then nullif(trim(p.sos_settings->>'finder_message'), '') end as lost_message,
       coalesce(p.is_lost, false) and p.sos_settings->>'reward_enabled' = 'true' as reward_enabled,
       case when p.is_lost and p.sos_settings->>'reward_enabled' = 'true'
                 and p.sos_settings->>'reward_amount' ~ '^[0-9]+(\.[0-9]+)?$'
            then nullif((p.sos_settings->>'reward_amount')::numeric, 0) end as reward_amount
from public.pets p;

revoke all on public.pet_cards from anon, authenticated;
grant select on public.pet_cards to anon, authenticated;

-- Künye bilgisinde de aynı güvenli dönüşüm (bozuk bir ödül değeri künye sayfasını çökertmesin).
create or replace function public.get_pet_tag_info(p_pet_id uuid)
returns table (pet_name text, species text, breed text, gender text, age text, avatar_url text,
               is_lost boolean, finder_message text, reward_amount numeric, owner_phone text)
language sql stable security definer set search_path = public as $$
    select c.name, c.type, c.breed, c.gender, c.age, c.avatar_url, c.is_lost, c.lost_message, c.reward_amount,
           case when p.is_lost and not coalesce(p.sos_settings->>'secure_proxy_only' = 'true', false)
                then coalesce(nullif(trim(p.sos_settings->>'emergency_sms_number'), ''), nullif(trim(p.sos_settings->'owner'->>'phone'), '')) end
    from pets p join pet_cards c on c.id = p.id
    where p.id = p_pet_id;
$$;
revoke execute on function public.get_pet_tag_info(uuid) from public;
grant execute on function public.get_pet_tag_info(uuid) to anon, authenticated;
