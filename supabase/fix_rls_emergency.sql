-- =====================================================================
-- ACİL DÜZELTME: profiles RLS - TÜM POLİTİKALAR SİLİNİP YENİDEN KURULDU
-- Bu script sadece Supabase SQL Editor'da çalıştırılmalıdır.
-- =====================================================================

-- ADIM 1: Önce mevcut tüm profiles politikalarını bul ve sil
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
        RAISE NOTICE 'Dropped: %', r.policyname;
    END LOOP;
END;
$$;

-- ADIM 2: SECURITY DEFINER fonksiyonu (RLS'i bypass eder, döngü olmaz)
DROP FUNCTION IF EXISTS public.get_my_role();

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(role, 'user') 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, anon, service_role, public;

-- ADIM 3: profiles RLS kapat ve tekrar aç (temizleme için)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ADIM 4: Basit ve kesin politikalar - DÖNGÜSÜZ
-- Herkes okuyabilir (en kritik - bu olmadan login çalışmaz)
CREATE POLICY "moffi_profiles_read"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

-- Sadece kendi kaydını oluşturabilir
CREATE POLICY "moffi_profiles_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Sadece kendi kaydını güncelleyebilir
CREATE POLICY "moffi_profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin silme
CREATE POLICY "moffi_profiles_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin' OR auth.uid() = id);

-- ADIM 5: Diğer tablolardaki profiles'a bağımlı politikaları düzelt
-- products
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated admins for products" ON public.products;
  DROP POLICY IF EXISTS "products_admin_all" ON public.products;
  DROP POLICY IF EXISTS "products_admin_all_v2" ON public.products;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "moffi_products_admin"
    ON public.products FOR ALL
    TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- orders  
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow select for owners and admins for orders" ON public.orders;
  DROP POLICY IF EXISTS "orders_select" ON public.orders;
  DROP POLICY IF EXISTS "orders_select_v2" ON public.orders;
  DROP POLICY IF EXISTS "Allow update for admins for orders" ON public.orders;
  DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
  DROP POLICY IF EXISTS "orders_update_admin_v2" ON public.orders;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "moffi_orders_select"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR get_my_role() = 'admin');

  CREATE POLICY "moffi_orders_update"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- order_items
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow select for order owners and admins for order_items" ON public.order_items;
  DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
  DROP POLICY IF EXISTS "order_items_select_v2" ON public.order_items;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "moffi_order_items_select"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND (o.user_id = auth.uid() OR get_my_role() = 'admin')
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- adoption_reports
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated admins for adoption_reports" ON public.adoption_reports;
  DROP POLICY IF EXISTS "adoption_reports_admin" ON public.adoption_reports;
  DROP POLICY IF EXISTS "adoption_reports_admin_v2" ON public.adoption_reports;
  CREATE POLICY "moffi_adoption_reports_admin"
    ON public.adoption_reports FOR ALL
    TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ADIM 6: Yetkiler
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;

-- ADIM 7: DOĞRULAMA - Bunlar çalışıyorsa her şey OK
SELECT '=== TEST 1: Policy list ===' as info;
SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public';

SELECT '=== TEST 2: Anon select ===' as info;
SELECT count(*) as profile_count FROM public.profiles;
