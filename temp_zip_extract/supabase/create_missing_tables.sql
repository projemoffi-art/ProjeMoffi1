-- =====================================================================
-- MOFFI MISSING TABLES CREATION & RLS SETUP
-- Run this in the SQL Editor of your Supabase Dashboard to:
-- 1. Recreate the conversations table to match application columns
-- 2. Create missing tables (messages, adoption_reports, app_feedbacks)
-- 3. Add moderation columns to the existing adoption_pets table
-- 4. Enable RLS and setup secure policies for all of them
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RECREATE conversations TABLE WITH CORRECT COLUMNS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS public.conversations CASCADE;

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

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
-- 2. CREATE messages TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text,
  text text,
  type varchar(50) DEFAULT 'chat',
  "user" varchar(100),
  is_system boolean DEFAULT false,
  isSystem boolean DEFAULT false,
  pet_name varchar(100),
  avatar text,
  location_link text,
  read boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for participants for messages" ON public.messages;
CREATE POLICY "Allow select for participants for messages" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
  OR sender_id = auth.uid()
  OR receiver_id = auth.uid()
);

DROP POLICY IF EXISTS "Allow insert for sender for messages" ON public.messages;
CREATE POLICY "Allow insert for sender for messages" 
ON public.messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  OR sender_id IS NULL
);

DROP POLICY IF EXISTS "Allow update for participants for messages" ON public.messages;
CREATE POLICY "Allow update for participants for messages" 
ON public.messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
  OR sender_id = auth.uid()
  OR receiver_id = auth.uid()
);

-- ---------------------------------------------------------------------
-- 3. CREATE adoption_reports TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.adoption_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.adoption_pets(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status varchar(50) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for adoption_reports
ALTER TABLE public.adoption_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for authenticated users for adoption_reports" ON public.adoption_reports;
CREATE POLICY "Allow insert for authenticated users for adoption_reports" 
ON public.adoption_reports FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Allow all for authenticated admins for adoption_reports" ON public.adoption_reports;
CREATE POLICY "Allow all for authenticated admins for adoption_reports" 
ON public.adoption_reports FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ---------------------------------------------------------------------
-- 4. CREATE app_feedbacks TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email varchar(255) NOT NULL,
  rating integer,
  message text NOT NULL,
  category varchar(100),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for app_feedbacks
ALTER TABLE public.app_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for everyone for app_feedbacks" ON public.app_feedbacks;
CREATE POLICY "Allow insert for everyone for app_feedbacks" 
ON public.app_feedbacks FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated admins for app_feedbacks" ON public.app_feedbacks;
CREATE POLICY "Allow all for authenticated admins for app_feedbacks" 
ON public.app_feedbacks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ---------------------------------------------------------------------
-- 5. EXTEND EXISTING adoption_pets TABLE WITH MODERATION FIELDS
-- ---------------------------------------------------------------------
ALTER TABLE IF EXISTS public.adoption_pets ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'available';
ALTER TABLE IF EXISTS public.adoption_pets ADD COLUMN IF NOT EXISTS moderation_result text;
ALTER TABLE IF EXISTS public.adoption_pets ADD COLUMN IF NOT EXISTS moderation_passed boolean DEFAULT true;
ALTER TABLE IF EXISTS public.adoption_pets ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- ---------------------------------------------------------------------
-- 6. CREATE orders, order_items, AND cart_items TABLES & RLS
-- ---------------------------------------------------------------------

-- Create orders table if not exists
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL,
    shipping_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table if not exists
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart_items table if not exists
CREATE TABLE IF NOT EXISTS public.cart_items (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- Enable RLS for all
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;

-- orders policies
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

-- order_items policies
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

-- cart_items policies
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
-- 7. GRANT PERMISSIONS FOR SHOP TABLES
-- ---------------------------------------------------------------------
GRANT ALL ON TABLE public.orders TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.order_items TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.cart_items TO postgres, service_role, authenticated, anon;


