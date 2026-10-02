-- Faz 1e: hesap silinebilsin diye bağlantı kuralları (Baran SQL Editor'dan uygular — DROP içerir).
-- Kural: kişinin kendi içeriği hesapla gider; başka tarafın kaydı (sipariş, klinik yorumu, randevu) isimsiz kalır.

-- Siparişler: satıcının satış/fatura kaydı silinmez, sadece kişiyle bağı kopar
alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint if exists fk_orders_user_id;
alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders add constraint orders_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- Randevular: işletmenin geçmişi kalır (isim prepare_account_purge ile "Silinmiş kullanıcı" yapılır)
alter table public.appointments drop constraint if exists appointments_user_id_fkey;
alter table public.appointments add constraint appointments_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete set null;

-- Klinik yorumları: işletmenin puanı korunur, yazar isimsiz kalır
alter table public.clinic_reviews alter column user_id drop not null;
alter table public.clinic_reviews drop constraint if exists clinic_reviews_user_id_fkey;
alter table public.clinic_reviews add constraint clinic_reviews_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

-- Kişiye ait kayıtlar hesapla gider
alter table public.notifications drop constraint if exists notifications_user_id_fkey;
alter table public.notifications add constraint notifications_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.pet_ownership_transfers drop constraint if exists pet_ownership_transfers_from_owner_id_fkey;
alter table public.pet_ownership_transfers add constraint pet_ownership_transfers_from_owner_id_fkey
    foreign key (from_owner_id) references auth.users(id) on delete cascade;
alter table public.pet_ownership_transfers drop constraint if exists pet_ownership_transfers_to_owner_id_fkey;
alter table public.pet_ownership_transfers add constraint pet_ownership_transfers_to_owner_id_fkey
    foreign key (to_owner_id) references auth.users(id) on delete cascade;

-- Diğer tarafın kaydı kalır, bağ kopar
alter table public.social_challenges drop constraint if exists social_challenges_winner_id_fkey;
alter table public.social_challenges add constraint social_challenges_winner_id_fkey
    foreign key (winner_id) references auth.users(id) on delete set null;

alter table public.unclaimed_patients drop constraint if exists unclaimed_patients_claimed_by_user_id_fkey;
alter table public.unclaimed_patients add constraint unclaimed_patients_claimed_by_user_id_fkey
    foreign key (claimed_by_user_id) references auth.users(id) on delete set null;
alter table public.unclaimed_patients drop constraint if exists unclaimed_patients_claim_requested_by_fkey;
alter table public.unclaimed_patients add constraint unclaimed_patients_claim_requested_by_fkey
    foreign key (claim_requested_by) references auth.users(id) on delete set null;
