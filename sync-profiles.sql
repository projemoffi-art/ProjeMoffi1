-- Sync existing users to profiles
INSERT INTO public.profiles (id, username, full_name, avatar_url, updated_at)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'full_name', ''),
    COALESCE(raw_user_meta_data->>'avatar_url', ''),
    now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
