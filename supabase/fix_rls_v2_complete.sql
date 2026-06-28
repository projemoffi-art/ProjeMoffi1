-- =====================================================================
-- MOFFI RLS INFINITE RECURSION - TAM TEMİZLİK VE YENİDEN KURULUM
-- Supabase Dashboard -> SQL Editor -> Tüm bu kodu yapıştır -> Run
-- =====================================================================

-- ADIM 1: Mevcut tüm profiles politikalarını sil
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- ADIM 2: get_my_role fonksiyonu oluştur (SECURITY DEFINER ile RLS bypass)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
        'user'
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, anon, public;

-- ADIM 3: profiles tablosunda RLS'i yeniden etkinleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- ADIM 4: Yeni, temiz ve döngüsüz politikalar kur
-- SELECT: Herkes herkesi okuyabilir
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- INSERT: Kullanıcı yalnızca kendi profilini oluşturabilir
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Kullanıcı yalnızca kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- DELETE: Yalnızca admin silebilir (fonksiyon kullanılıyor, döngü yok)
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (get_my_role() = 'admin');

-- ADIM 5: Diğer tablolardaki profiles'a bağımlı politikaları düzelt
-- products
DROP POLICY IF EXISTS "Allow all for authenticated admins for products" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all_v2"
  ON public.products FOR ALL
  USING (get_my_role() = 'admin');

-- orders
DROP POLICY IF EXISTS "Allow select for owners and admins for orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select_v2"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "Allow update for admins for orders" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin_v2"
  ON public.orders FOR UPDATE
  USING (get_my_role() = 'admin');

-- order_items
DROP POLICY IF EXISTS "Allow select for order owners and admins for order_items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select_v2"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR get_my_role() = 'admin')
    )
  );

-- adoption_reports
DROP POLICY IF EXISTS "Allow all for authenticated admins for adoption_reports" ON public.adoption_reports;
DROP POLICY IF EXISTS "adoption_reports_admin" ON public.adoption_reports;
CREATE POLICY "adoption_reports_admin_v2"
  ON public.adoption_reports FOR ALL
  USING (get_my_role() = 'admin');

-- app_feedbacks
DROP POLICY IF EXISTS "Allow all for authenticated admins for app_feedbacks" ON public.app_feedbacks;
DROP POLICY IF EXISTS "app_feedbacks_admin" ON public.app_feedbacks;
CREATE POLICY "app_feedbacks_admin_v2"
  ON public.app_feedbacks FOR ALL
  USING (get_my_role() = 'admin');

-- ADIM 6: Genel izinler
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;

-- ADIM 7: Doğrulama (Bu 2 sorgu da hata vermeden çalışıyorsa TAMAM)
SELECT 'TEST 1 - anonymous select:' as test, count(*) as count FROM public.profiles;
SELECT 'TEST 2 - policy list:' as test, policyname FROM pg_policies WHERE tablename = 'profiles';
