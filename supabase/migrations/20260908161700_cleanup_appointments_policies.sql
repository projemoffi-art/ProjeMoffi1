-- Migration: cleanup_appointments_policies

DROP POLICY IF EXISTS "Allow clinic to select own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow clinic to update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Klinikler randevularini gorebilir" ON public.appointments;
DROP POLICY IF EXISTS "Users manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users read own appointments" ON public.appointments;
