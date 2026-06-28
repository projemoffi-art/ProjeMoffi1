-- =====================================================================
-- MOFFI RLS FIX - CASCADE VERSION
-- Supabase Dashboard -> SQL Editor -> Yapıştır -> Run
-- =====================================================================

-- ADIM 1: Fonksiyonu CASCADE ile sil (bağımlı tüm politikalar da silinir)
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- ADIM 2: profiles tablosundaki tüm kalan politikaları temizle
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
    END LOOP;
END;
$$;

-- ADIM 3: SECURITY DEFINER fonksiyonu (RLS bypass - sonsuz döngü olmaz)
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

-- ADIM 4: profiles RLS sıfırla
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ADIM 5: profiles için temiz politikalar
CREATE POLICY "moffi_profiles_read"
  ON public.profiles FOR SELECT TO public USING (true);

CREATE POLICY "moffi_profiles_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "moffi_profiles_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "moffi_profiles_delete"
  ON public.profiles FOR DELETE TO authenticated
  USING (get_my_role() = 'admin' OR auth.uid() = id);

-- ADIM 6: products tablosu
DO $$ BEGIN
  CREATE POLICY "moffi_products_admin"
    ON public.products FOR ALL TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ADIM 7: orders tablosu
DO $$ BEGIN
  CREATE POLICY "moffi_orders_select"
    ON public.orders FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR get_my_role() = 'admin');
  CREATE POLICY "moffi_orders_update"
    ON public.orders FOR UPDATE TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ADIM 8: order_items tablosu
DO $$ BEGIN
  CREATE POLICY "moffi_order_items_select"
    ON public.order_items FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND (o.user_id = auth.uid() OR get_my_role() = 'admin')
      )
    );
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ADIM 9: adoption_reports tablosu
DO $$ BEGIN
  CREATE POLICY "moffi_adoption_reports_admin"
    ON public.adoption_reports FOR ALL TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ADIM 10: app_feedbacks tablosu
DO $$ BEGIN
  CREATE POLICY "moffi_app_feedbacks_admin"
    ON public.app_feedbacks FOR ALL TO authenticated
    USING (get_my_role() = 'admin');
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ADIM 11: Yetkiler
GRANT ALL ON TABLE public.profiles TO postgres, service_role, authenticated, anon;

-- DOĞRULAMA
SELECT 'OK - Policy list:' as status, policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
UNION ALL
SELECT 'OK - Profile count: ' || count(*)::text, '' FROM public.profiles;
