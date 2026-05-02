-- 1. Yeni kullanıcılar için profil oluşturan fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'https://i.pravatar.cc/150?u=' || new.id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger'ı oluştur (Eğer varsa önce sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Geçmişe dönük eksik profilleri tamamla (Backfill)
INSERT INTO public.profiles (id, full_name, username, avatar_url)
SELECT 
    id, 
    raw_user_meta_data->>'full_name',
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    'https://i.pravatar.cc/150?u=' || id
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Admin kullanıcı için özel yetki (Opsiyonel ama faydalı)
UPDATE public.profiles 
SET bio = 'Moffi Dünyasının Resmi Haber ve Destek Merkezi. 🐾'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'projemoffi@gmail.com');
