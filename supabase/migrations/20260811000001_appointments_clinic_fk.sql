-- clinic_id'nin gerçekten profiles.id'ye işaret ettiğini veritabanına tanıtıyoruz
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_clinic_id_profiles_fkey
FOREIGN KEY (clinic_id) REFERENCES public.profiles(id);
