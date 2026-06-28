-- =====================================================================
-- MOFFI RLS INFINITE RECURSION FIX
-- =====================================================================
-- "infinite recursion detected in policy for relation profiles" hatasını düzeltir.
-- Sorun: Bazı tablo politikaları "profiles" tablosunu sorgularken,
-- profiles tablosunun kendi SELECT politikası yeniden devreye giriyor → sonsuz döngü.
--
-- Çözüm: profiles tablosunu sorgulayan politikalarda auth.jwt() ile
-- doğrudan JWT'den rol okunarak profiles tablosuna sorgusuz role check yapılır.
-- Veya role check gerektiren politikalar için security definer function kullanılır.
-- =====================================================================

-- 1. Güvenli rol okuma fonksiyonu (security definer = RLS'i bypass eder)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. profiles tablosu - tüm eski politikaları temizle ve yeniden oluştur
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for user themselves" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for user themselves" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Herkes profil okuyabilir (SELECT) - basit true politika, sonsuz döngü yok
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
USING (true);

-- Kullanıcı kendi profilini ekleyebilir
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin silme yetkisi (get_my_role() fonksiyonu ile güvenli)
CREATE POLICY "profiles_delete_admin"
ON public.profiles FOR DELETE
USING (get_my_role() = 'admin');

-- 3. products tablosu - profiles'a sorgusuz yeniden yaz
DROP POLICY IF EXISTS "Allow all for authenticated admins for products" ON public.products;

CREATE POLICY "products_admin_all"
ON public.products FOR ALL
USING (get_my_role() = 'admin');

-- 4. orders tablosu
DROP POLICY IF EXISTS "Allow select for owners and admins for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update for admins for orders" ON public.orders;

CREATE POLICY "orders_select"
ON public.orders FOR SELECT
USING (
    auth.uid() = user_id
    OR get_my_role() = 'admin'
);

CREATE POLICY "orders_update_admin"
ON public.orders FOR UPDATE
USING (get_my_role() = 'admin');

-- 5. order_items tablosu
DROP POLICY IF EXISTS "Allow select for order owners and admins for order_items" ON public.order_items;

CREATE POLICY "order_items_select"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
          AND (orders.user_id = auth.uid() OR get_my_role() = 'admin')
    )
);

-- 6. adoption_reports tablosu (eğer varsa)
DROP POLICY IF EXISTS "Allow all for authenticated admins for adoption_reports" ON public.adoption_reports;
CREATE POLICY "adoption_reports_admin"
ON public.adoption_reports FOR ALL
USING (get_my_role() = 'admin');

-- 7. app_feedbacks tablosu (eğer varsa)
DROP POLICY IF EXISTS "Allow all for authenticated admins for app_feedbacks" ON public.app_feedbacks;
CREATE POLICY "app_feedbacks_admin"
ON public.app_feedbacks FOR ALL
USING (get_my_role() = 'admin');

-- 8. Genel izin güncellemesi
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, anon;

-- Doğrulama sorgusu - bu çalışıyorsa sonsuz döngü giderilmiştir:
SELECT id, username, role FROM public.profiles LIMIT 3;
