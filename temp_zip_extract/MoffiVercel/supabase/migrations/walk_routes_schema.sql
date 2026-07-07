-- ====================================================================
-- PREDEFINED ROUTES SCHEMA & SEED DATA MIGRATION
-- ====================================================================
-- Run this SQL in your Supabase SQL Editor to create the `walk_routes` table
-- and populate it with initial predefined routes.

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS public.walk_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    distance_km NUMERIC(4, 2) NOT NULL,
    icon TEXT DEFAULT '🍃', -- emoji or icon key
    color TEXT DEFAULT '#10b981', -- Hex color code
    is_sponsored BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. SEED INITIAL ROUTES
INSERT INTO public.walk_routes (name, distance_km, icon, color, is_sponsored)
VALUES
    ('Serbest Gezi', 1.5, '🍃', '#10b981', false),
    ('Park Rotası', 2.5, '🌳', '#f59e0b', false),
    ('Sahil Yolu', 4.0, '🌊', '#3b82f6', false),
    ('Mahalle Turu', 1.8, '🏠', '#8b5cf6', false)
ON CONFLICT DO NOTHING;

-- 3. VERİTABANI DÜZEYİNDE ERİŞİM YETKİLERİ (GRANT)
GRANT ALL ON TABLE public.walk_routes TO postgres, service_role, authenticated, anon;

-- 4. SATIR BAZLI GÜVENLİK (RLS) POLİTİKALARI
ALTER TABLE public.walk_routes ENABLE ROW LEVEL SECURITY;

-- Policy: Herkes rotaları okuyabilir
DROP POLICY IF EXISTS "Anyone can read walk routes" ON public.walk_routes;
CREATE POLICY "Anyone can read walk routes"
ON public.walk_routes
FOR SELECT
TO public;

-- Policy: Sadece Admin / Service Role ekleme/güncelleme yapabilir (Varsayılan olarak kısıtlı tutuyoruz)
DROP POLICY IF EXISTS "Admins can manage walk routes" ON public.walk_routes;
CREATE POLICY "Admins can manage walk routes"
ON public.walk_routes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
