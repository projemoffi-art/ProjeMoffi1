-- Faz 1: Randevu görünürlüğü — klinik erişimi ekleniyor

DROP POLICY IF EXISTS "Allow select for authenticated users on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow select for owner or clinic" ON public.appointments;
CREATE POLICY "Allow select for owner or clinic"
ON public.appointments FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = clinic_id);

DROP POLICY IF EXISTS "Allow update for authenticated users on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow update for owner or clinic" ON public.appointments;
CREATE POLICY "Allow update for owner or clinic"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = clinic_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = clinic_id);
