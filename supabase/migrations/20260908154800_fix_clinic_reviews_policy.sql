-- Migration: fix_clinic_reviews_policy

DROP POLICY IF EXISTS "Kullanıcı kendi randevusuna yorum yazar" ON public.clinic_reviews;

CREATE POLICY "Kullanıcı kendi randevusuna yorum yazar" ON public.clinic_reviews
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_id
        AND a.user_id = auth.uid()
        AND a.clinic_id = clinic_reviews.clinic_id
        AND a.status = 'confirmed'
        AND a.appointment_date < now()
    )
);
