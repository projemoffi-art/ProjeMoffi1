-- =====================================================================
-- SEED DATA: LOST PETS (ACİL SOS)
-- Run this in the SQL Editor of your Supabase Dashboard to populate
-- the lost_pets table with test data linked to existing profiles.
-- =====================================================================

DO $$
DECLARE
    first_user_uuid UUID;
    second_user_uuid UUID;
    third_user_uuid UUID;
BEGIN
    -- Try to find existing users from auth.users
    SELECT id INTO first_user_uuid FROM auth.users ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO second_user_uuid FROM auth.users ORDER BY created_at ASC LIMIT 1 OFFSET 1;
    SELECT id INTO third_user_uuid FROM auth.users ORDER BY created_at ASC LIMIT 1 OFFSET 2;

    -- Clear ALL existing records from lost_pets to start fresh and remove old test data (like Delal, Zelal, etc.)
    TRUNCATE TABLE public.lost_pets CASCADE;

    -- Insert seed data for Luna
    INSERT INTO public.lost_pets (
        pet_name, img_url, location_text, reward_enabled, reward_amount, 
        description, pet_type, latitude, longitude, user_id, created_at
    ) VALUES (
        'Luna', 
        'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=600', 
        'Moda Parkı, Kadıköy', 
        true, 
        5000, 
        'Golden Retriever cinsi 2 yaşında Luna, Moda Parkı civarında kaybolmuştur. Çok uysal ve cana yakındır, yabancılardan korkmaz. Tasmasında kırmızı SOS tasması bulunmaktadır.', 
        'dog', 
        40.9850, 
        29.0300, 
        first_user_uuid, 
        now()
    );

    -- Insert seed data for Felix
    INSERT INTO public.lost_pets (
        pet_name, img_url, location_text, reward_enabled, reward_amount, 
        description, pet_type, latitude, longitude, user_id, created_at
    ) VALUES (
        'Felix', 
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600', 
        'Göztepe Özgürlük Parkı', 
        true, 
        3000, 
        'Tuxedo cinsi Felix, Göztepe Özgürlük Parkı yakınlarında balkondan düşerek kaybolmuştur. Sol kulağının ucu hafif kesiktir. Çok ürkektir, yaklaşırken yavaş olun.', 
        'cat', 
        40.9780, 
        29.0550, 
        COALESCE(second_user_uuid, first_user_uuid), 
        now() - interval '1 hour'
    );

    -- Insert seed data for Şila
    INSERT INTO public.lost_pets (
        pet_name, img_url, location_text, reward_enabled, reward_amount, 
        description, pet_type, latitude, longitude, user_id, created_at
    ) VALUES (
        'Şila', 
        'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?q=80&w=600', 
        'Bostancı Sahili', 
        false, 
        NULL, 
        'Alman Çoban Köpeği Şila, dün akşam Bostancı Sahili''nde ses fişeğinden korkup tasmasını kopararak kaçmıştır. İnsan canlısıdır ve komut bilir.', 
        'dog', 
        40.9580, 
        29.0950, 
        COALESCE(third_user_uuid, first_user_uuid), 
        now() - interval '2 hours'
    );

END $$;
