-- ELLE ÇALIŞTIRILACAK (Supabase SQL Editor): bağlayıcı bu kelimeleri içeren komutları VS Code'dan onaylatamıyor.
-- Acil değil: 20261003100000_walk_economy_lockdown sonrası bunlar zaten işlevsiz, sadece temizlik.

-- walk_sessions'a istemci artık yazamıyor (yetki kaldırıldı); yazma politikaları ve tekrar eden okuma
-- politikaları gereksiz. Sadece "Users read own walks" (SELECT, auth.uid() = user_id) kalır.
drop policy if exists "Users can manage their own walk sessions" on public.walk_sessions;
drop policy if exists "Users can perform all actions on their own walk sessions" on public.walk_sessions;
drop policy if exists "Users insert own walks" on public.walk_sessions;
drop policy if exists "Users manage own walks" on public.walk_sessions;
drop policy if exists "Users update own walks" on public.walk_sessions;

-- Herkese açık okuma artık get_walk_beacon() üzerinden; bu politika sahibine daraltılmıştı, tekrar ediyor.
drop policy if exists "Anyone can view unexpired beacons" on public.walk_beacons;

-- İlk denemede 'reward' kaynağı için açılan index kullanılmıyor (ödüller 'quest' kaynağıyla yazılıyor).
drop index if exists public.point_transactions_reward_once;

-- start_walk_session (20261003110000) yerini aldı; B aşaması yayına çıktıktan sonra eski imza gereksiz.
drop function if exists public.start_walk(text);
