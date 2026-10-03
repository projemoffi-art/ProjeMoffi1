-- 5.7 kuralı taraması (2026-10-03): RLS politikası olan ama rolüne GRANT verilmemiş, istemcinin doğrudan okuduğu tablolar.
-- Hepsi "permission denied" ile sessizce boş/yedek veriye düşüyordu. Satır erişimini mevcut politikalar sınırlar.
-- game_modules (oyun listesi; ekran sabit yedek listeyle açılıyordu), activity_locations (yönetici Aktivite: hep boştu),
-- app_feedbacks (yönetici geri bildirim listesi ve silme), nutrition_plans (veteriner diyet planı penceresi: hiç okunamıyor/
-- kaydedilemiyordu — "0 satır" bulgusunun asıl nedeni), quests (işletme görevleri, aktif olanlar).
-- Bilerek kapalı kalanlar: lost_pets/adoption_pets (kart görünümleri), platform_settings, orders/order_items (anon),
-- audit_logs, business_invitations, transactions, sms_log, subscription_intents, user_connections.
grant select on public.game_modules to anon, authenticated;
grant select on public.activity_locations to authenticated;
grant select, delete on public.app_feedbacks to authenticated;
grant select, insert, update on public.nutrition_plans to authenticated;
grant select on public.quests to authenticated;
