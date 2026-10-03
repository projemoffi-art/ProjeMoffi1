-- İçerik Stüdyosu uçtan uca testinden kalan veriler (2026-10-04). Baran SQL Editor'dan bir kez çalıştırır.
-- Test hesapları silindi; geriye yalnızca bunlar kaldı. Şimdilik arşivde / onaysız oldukları için hiçbir yerde görünmüyorlar.
-- content_items'ta bugün yalnızca test satırları var ("[TEST]" önekli, 3 satır).

delete from public.content_events where content_id in (select id from public.content_items where title like '[TEST]%');
delete from public.content_items where title like '[TEST]%';
delete from public.businesses where id = '6ff70e8a-54ea-4f65-a3ea-a039c27884c4' and name = '[TEST] silinecek klinik';
