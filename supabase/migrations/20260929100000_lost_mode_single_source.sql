-- Kayıp modu tek kaynak: künyede (pet_cards / get_pet_tag_info / get_pet_verification_info) görünen kayıp
-- mesajı, ödül ve telefon artık hayvanın yayındaki kayıp ilanından gelir. Önceden aynı bilgiler
-- pets.sos_settings içinde ikinci bir kopya olarak tutuluyordu (SOS penceresi) ve ilanla uyuşmayabiliyordu.
-- pets.is_lost sadece ilan yayınlama / kavuşma fonksiyonlarıyla değişir; istemci doğrudan değiştiremez.

-- 1) sos_settings'teki bilgi ilanda yoksa ilana taşı (kayıpsız geçiş).
update public.lost_pets l
set approach_note = coalesce(nullif(trim(l.approach_note), ''), nullif(trim(p.sos_settings->>'finder_message'), ''))
from public.pets p
where l.pet_id = p.id and l.status = 'active' and l.kind = 'lost'
  and nullif(trim(l.approach_note), '') is null
  and nullif(trim(p.sos_settings->>'finder_message'), '') is not null
  and trim(p.sos_settings->>'finder_message') not in ('Lütfen bana yardım edin, ailemi bulamıyorum.', 'Lütfen yardıma ihtiyacım var!');

update public.lost_pets l
set reward_enabled = true, reward_amount = (p.sos_settings->>'reward_amount')::numeric
from public.pets p
where l.pet_id = p.id and l.status = 'active' and l.kind = 'lost'
  and not coalesce(l.reward_enabled, false)
  and (p.sos_settings->>'reward_enabled') is distinct from 'false'
  and (p.sos_settings->>'reward_amount') ~ '^[0-9]+(\.[0-9]+)?$'
  and (p.sos_settings->>'reward_amount')::numeric > 0;

-- 2) pet_cards: kayıp mesajı ve ödül hayvanın yayındaki (en yeni) kayıp ilanından; kolon listesi aynı kalır.
-- Not: görünüm içinde fonksiyon çağrılırsa yetkisi çağıran kullanıcıya göre denetlenir; bu yüzden alt sorgu.
create or replace view public.pet_cards as
select p.id, p.owner_id, p.name, p.type, p.breed, p.gender, p.age, p.size, p."character",
       p.avatar_url, p.cover_url, coalesce(p.is_lost, false) as is_lost, p.xp, p.level,
       p.equipped_apparel, p.avatar_body_color, p.avatar_background, p.created_at,
       case when p.is_lost then coalesce(nullif(trim(l.approach_note), ''), nullif(trim(l.description), '')) end as lost_message,
       coalesce(p.is_lost, false) and coalesce(l.reward_enabled, false) and coalesce(l.reward_amount, 0) > 0 as reward_enabled,
       case when p.is_lost and coalesce(l.reward_enabled, false) then nullif(l.reward_amount, 0) end as reward_amount
from public.pets p
left join lateral (
    select x.approach_note, x.description, x.reward_enabled, x.reward_amount
    from public.lost_pets x
    where x.pet_id = p.id and x.status = 'active' and x.kind = 'lost'
    order by x.created_at desc limit 1
) l on true;

-- 3) Künye: telefon sadece ilanda "telefonla ulaşılsın" seçildiyse.
create or replace function public.get_pet_tag_info(p_pet_id uuid)
returns table(pet_name text, species text, breed text, gender text, age text, avatar_url text, is_lost boolean,
              finder_message text, reward_amount numeric, owner_phone text)
language sql stable security definer set search_path = public
as $$
    select c.name, c.type, c.breed, c.gender, c.age, c.avatar_url, c.is_lost, c.lost_message, c.reward_amount,
           case when c.is_lost and l.contact_mode = 'phone' then nullif(trim(l.contact_phone), '') end
    from pet_cards c
    left join lateral (
        select x.contact_mode, x.contact_phone from lost_pets x
        where x.pet_id = c.id and x.status = 'active' and x.kind = 'lost'
        order by x.created_at desc limit 1
    ) l on true
    where c.id = p_pet_id;
$$;

-- 4) pets.is_lost istemciden değişmez (ilan yayınlama / kavuşma fonksiyonları SECURITY DEFINER, geçer).
create or replace function public.pets_guard_lost_flag()
returns trigger language plpgsql set search_path = public
as $$
begin
    if current_user in ('authenticated', 'anon') then
        if tg_op = 'INSERT' then new.is_lost := false;
        else new.is_lost := old.is_lost; end if;
    end if;
    return new;
end;
$$;
drop trigger if exists pets_guard_lost_flag on public.pets;
create trigger pets_guard_lost_flag before insert or update on public.pets
for each row execute function public.pets_guard_lost_flag();
