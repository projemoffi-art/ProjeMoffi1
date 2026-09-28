-- Tıbbi belgeler yalnızca sahibine açık; klinikle paylaşım sahibin açık seçimiyle (karne paylaşımı) olur.
drop policy if exists "Medical documents: owner or treating clinic reads" on storage.objects;
create policy "Medical documents: owner reads" on storage.objects
for select to authenticated using (bucket_id = 'medical-documents' and public.owns_pet_folder(name));
