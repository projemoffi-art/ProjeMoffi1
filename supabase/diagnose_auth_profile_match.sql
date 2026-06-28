-- Bu SQL, hangi auth kullanıcısının hangi profile bağlı olduğunu gösterir
-- Supabase Dashboard > SQL Editor > Çalıştır

-- auth.users ile profiles tablosunu karşılaştır
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    p.id as profile_id,
    p.username,
    p.full_name,
    p.role,
    CASE 
        WHEN p.id IS NULL THEN '❌ PROFİL YOK'
        WHEN au.id = p.id THEN '✅ EŞLEŞİYOR'
        ELSE '⚠️ FARKLI ID'
    END as durum
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
