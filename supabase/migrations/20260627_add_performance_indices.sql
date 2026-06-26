-- =====================================================================
-- MOFFI PERFORMANCE INDICES MIGRATION
-- Run this script in the SQL Editor of your Supabase Dashboard
-- to optimize query response times and prevent Full Table Scans (Seq Scan)
-- on foreign key lookups and ordered queries as data grows.
-- =====================================================================

-- 1. posts table indices
-- Optimization for user profile grids (fetching posts of a specific user ordered by time)
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 2. comments table indices
-- Optimization for fetching post comments (ordered by creation time)
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- 3. likes table indices
-- Optimization for checking if user liked a post, and counting post likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- 4. messages table indices
-- Optimization for fetching chat history (ordered by time)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 5. orders & order_items indices
-- Optimization for user order lists and fetching order items
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6. notifications indices
-- Optimization for fetching unread notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
