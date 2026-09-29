-- Bulunan hayvanın adı bilinmez; "Buldum" bildirimi pet_name olmadan gelir ve NOT NULL yüzünden hep reddediliyordu.
alter table public.lost_pets alter column pet_name drop not null;
alter table public.lost_pets add constraint lost_pets_name_required_for_lost check (kind = 'found' or nullif(btrim(pet_name), '') is not null);
