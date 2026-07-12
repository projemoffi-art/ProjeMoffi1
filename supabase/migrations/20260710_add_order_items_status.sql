-- Add foreign key from orders to profiles
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add status column to order_items for seller-specific status tracking
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'awaiting_payment';
