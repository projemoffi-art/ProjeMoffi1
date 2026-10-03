-- 🔴 GÜVENLİK (2026-10-04): avatars / posts / stories / sounds depolarında güncelleme ve silme kuralları sahiplik
-- denetlemiyordu: giriş yapmış HERHANGİ bir kullanıcı başka birinin profil fotoğrafını, gönderi görselini ya da
-- hikâye medyasını silebilir veya üzerine yazabilirdi. Bu dosya kuralları "yalnızca dosyanın sahibi" ile değiştirir.
-- Sahiplik: Storage'ın owner alanı ya da uygulamanın yükleme yolu (<kullanıcı-id>/dosya, apiService.uploadMedia).
-- Yönetici moderasyonu servis rolüyle yapılır, bu kurallardan etkilenmez.
-- Baran SQL Editor'dan çalıştırır (bağlayıcı DROP içeren komutu uygulayamıyor).

begin;

drop policy if exists "Authenticated update policy for storage" on storage.objects;
drop policy if exists "Authenticated delete policy for storage" on storage.objects;

create policy "Sahibi gunceller (avatars posts stories sounds)" on storage.objects
    for update to authenticated
    using (
        bucket_id = any (array['avatars', 'posts', 'stories', 'sounds'])
        and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
    )
    with check (
        bucket_id = any (array['avatars', 'posts', 'stories', 'sounds'])
        and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
    );

create policy "Sahibi siler (avatars posts stories sounds)" on storage.objects
    for delete to authenticated
    using (
        bucket_id = any (array['avatars', 'posts', 'stories', 'sounds'])
        and (owner = auth.uid() or (storage.foldername(name))[1] = auth.uid()::text)
    );

commit;
