-- Migration: Prevent Double Bookings
-- B10 Randevu Çakışma Koruması: Aynı kliniğe aynı saatte iki randevu alınmasını engeller.

-- ÖNEMLİ: Bu index'i eklemeden önce mevcut tablodaki çakışan kayıtları kontrol edin.
-- Varsa aşağıdaki SQL ile temizleyebilirsiniz veya durumu 'cancelled' yapabilirsiniz.
/*
SELECT clinic_id, appointment_date, COUNT(*) 
FROM public.appointments 
WHERE status IN ('pending','confirmed')
GROUP BY clinic_id, appointment_date 
HAVING COUNT(*) > 1;
*/

CREATE UNIQUE INDEX idx_no_double_booking
ON public.appointments (clinic_id, appointment_date)
WHERE status IN ('pending', 'confirmed');
