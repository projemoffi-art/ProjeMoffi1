-- =====================================================================
-- MOFFI SUPABASE ROW LEVEL SECURITY (RLS) POLICIES SETUP
-- Run this script in the SQL Editor of your Supabase Dashboard
-- to enable RLS and configure security policies for existing tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for profiles" ON public.profiles;
CREATE POLICY "Allow public read access for profiles" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for user themselves" ON public.profiles;
CREATE POLICY "Allow insert for user themselves" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow update for user themselves" ON public.profiles;
CREATE POLICY "Allow update for user themselves" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 2. posts TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for posts" ON public.posts;
CREATE POLICY "Allow public read access for posts" 
ON public.posts FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for posts" ON public.posts;
CREATE POLICY "Allow insert for authenticated users for posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for owners for posts" ON public.posts;
CREATE POLICY "Allow update for owners for posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete for owners for posts" ON public.posts;
CREATE POLICY "Allow delete for owners for posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. likes TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for likes" ON public.likes;
CREATE POLICY "Allow public read access for likes" 
ON public.likes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for likes" ON public.likes;
CREATE POLICY "Allow insert for authenticated users for likes" 
ON public.likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete for owners for likes" ON public.likes;
CREATE POLICY "Allow delete for owners for likes" 
ON public.likes FOR DELETE 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. comments TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for comments" ON public.comments;
CREATE POLICY "Allow public read access for comments" 
ON public.comments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for comments" ON public.comments;
CREATE POLICY "Allow insert for authenticated users for comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for owners for comments" ON public.comments;
CREATE POLICY "Allow update for owners for comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete for owners for comments" ON public.comments;
CREATE POLICY "Allow delete for owners for comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. comment_likes TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for comment_likes" ON public.comment_likes;
CREATE POLICY "Allow public read access for comment_likes" 
ON public.comment_likes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for comment_likes" ON public.comment_likes;
CREATE POLICY "Allow insert for authenticated users for comment_likes" 
ON public.comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete for owners for comment_likes" ON public.comment_likes;
CREATE POLICY "Allow delete for owners for comment_likes" 
ON public.comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. lost_pets TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.lost_pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for lost_pets" ON public.lost_pets;
CREATE POLICY "Allow public read access for lost_pets" 
ON public.lost_pets FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for lost_pets" ON public.lost_pets;
CREATE POLICY "Allow insert for authenticated users for lost_pets" 
ON public.lost_pets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update/delete for owners for lost_pets" ON public.lost_pets;
CREATE POLICY "Allow update/delete for owners for lost_pets" 
ON public.lost_pets FOR ALL 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 7. adoption_pets TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.adoption_pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for adoption_pets" ON public.adoption_pets;
CREATE POLICY "Allow public read access for adoption_pets" 
ON public.adoption_pets FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for adoption_pets" ON public.adoption_pets;
CREATE POLICY "Allow insert for authenticated users for adoption_pets" 
ON public.adoption_pets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update/delete for owners for adoption_pets" ON public.adoption_pets;
CREATE POLICY "Allow update/delete for owners for adoption_pets" 
ON public.adoption_pets FOR ALL 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 8. pets TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for pets" ON public.pets;
CREATE POLICY "Allow public read access for pets" 
ON public.pets FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users for pets" ON public.pets;
CREATE POLICY "Allow insert for authenticated users for pets" 
ON public.pets FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow update/delete for owners for pets" ON public.pets;
CREATE POLICY "Allow update/delete for owners for pets" 
ON public.pets FOR ALL 
USING (auth.uid() = owner_id);

-- ---------------------------------------------------------------------
-- 9. conversations TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for participants for conversations" ON public.conversations;
CREATE POLICY "Allow select for participants for conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Allow insert for participants for conversations" ON public.conversations;
CREATE POLICY "Allow insert for participants for conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Allow update for participants for conversations" ON public.conversations;
CREATE POLICY "Allow update for participants for conversations" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ---------------------------------------------------------------------
-- 10. notifications TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select/update/delete for owners for notifications" ON public.notifications;
CREATE POLICY "Allow select/update/delete for owners for notifications" 
ON public.notifications FOR ALL 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for all for notifications" ON public.notifications;
CREATE POLICY "Allow insert for all for notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 11. products TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for products" ON public.products;
CREATE POLICY "Allow public read access for products" 
ON public.products FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated admins for products" ON public.products;
CREATE POLICY "Allow all for authenticated admins for products" 
ON public.products FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ---------------------------------------------------------------------
-- 12. orders TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for owners and admins for orders" ON public.orders;
CREATE POLICY "Allow select for owners and admins for orders" 
ON public.orders FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow insert for authenticated users for orders" ON public.orders;
CREATE POLICY "Allow insert for authenticated users for orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for admins for orders" ON public.orders;
CREATE POLICY "Allow update for admins for orders" 
ON public.orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ---------------------------------------------------------------------
-- 13. cart_items TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for owners for cart_items" ON public.cart_items;
CREATE POLICY "Allow select for owners for cart_items" 
ON public.cart_items FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for owners for cart_items" ON public.cart_items;
CREATE POLICY "Allow insert for owners for cart_items" 
ON public.cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update for owners for cart_items" ON public.cart_items;
CREATE POLICY "Allow update for owners for cart_items" 
ON public.cart_items FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete for owners for cart_items" ON public.cart_items;
CREATE POLICY "Allow delete for owners for cart_items" 
ON public.cart_items FOR DELETE 
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 14. order_items TABLE
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for order owners and admins for order_items" ON public.order_items;
CREATE POLICY "Allow select for order owners and admins for order_items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ))
  )
);

DROP POLICY IF EXISTS "Allow insert for authenticated users for order_items" ON public.order_items;
CREATE POLICY "Allow insert for authenticated users for order_items" 
ON public.order_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- 15. GRANT PERMISSIONS FOR SHOP TABLES
-- ---------------------------------------------------------------------
GRANT ALL ON TABLE public.orders TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.order_items TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.cart_items TO postgres, service_role, authenticated, anon;


