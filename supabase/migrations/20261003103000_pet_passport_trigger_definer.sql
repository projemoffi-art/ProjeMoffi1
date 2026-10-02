-- 20260928100700_pet_passport sonrası istemciden hiçbir hayvan eklenemiyordu: pets_passport_no_guard tetikleyicisi
-- ekleyen kullanıcının yetkisiyle çalışıyor, pet_passport_seq ise sadece sahibine açık ("permission denied for
-- sequence pet_passport_seq"). Tetikleyici sahibinin yetkisiyle çalışır; kullanıcıya sayaç yetkisi verilmez,
-- pasaport numarası yine sadece burada üretilir.
alter function public.pets_passport_no_guard() security definer;
alter function public.pets_passport_no_guard() set search_path to 'public';
revoke execute on function public.pets_passport_no_guard() from public, anon, authenticated;
