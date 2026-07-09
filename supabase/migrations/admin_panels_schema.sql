-- ====================================================================
-- ADMIN PANELS MIGRATION: activity_locations, studio_assets, platform_settings
-- ====================================================================

-- 1. CREATE TABLES
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    uses INTEGER DEFAULT 0,
    is_prime BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ADD COMMISSION COLUMNS TO ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;

-- 2. ENABLE RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_locations ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES

-- platform_settings: Only admin can read and write
DROP POLICY IF EXISTS "Admin only read platform_settings" ON public.platform_settings;
CREATE POLICY "Admin only read platform_settings" ON public.platform_settings
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin only insert platform_settings" ON public.platform_settings;
CREATE POLICY "Admin only insert platform_settings" ON public.platform_settings
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin only update platform_settings" ON public.platform_settings;
CREATE POLICY "Admin only update platform_settings" ON public.platform_settings
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin only delete platform_settings" ON public.platform_settings;
CREATE POLICY "Admin only delete platform_settings" ON public.platform_settings
FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- studio_assets: Everyone can read, Admin only write
DROP POLICY IF EXISTS "Anyone read studio_assets" ON public.studio_assets;
CREATE POLICY "Anyone read studio_assets" ON public.studio_assets
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write studio_assets" ON public.studio_assets;
CREATE POLICY "Admin write studio_assets" ON public.studio_assets
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- activity_locations: Everyone can read, Admin only write
DROP POLICY IF EXISTS "Anyone read activity_locations" ON public.activity_locations;
CREATE POLICY "Anyone read activity_locations" ON public.activity_locations
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write activity_locations" ON public.activity_locations;
CREATE POLICY "Admin write activity_locations" ON public.activity_locations
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. RPC FUNCTION (Haversine tabanlı mesafe hesabı ve aktif kişi sorgusu)

-- Yardımcı Haversine Fonksiyonu
CREATE OR REPLACE FUNCTION public.haversine_distance(lat1 float, lng1 float, lat2 float, lng2 float)
RETURNS float AS $$
DECLARE
    dlat float;
    dlng float;
    a float;
    c float;
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    RETURN 6371 * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ana RPC: Bir lokasyondaki aktif kullanıcı sayısı
CREATE OR REPLACE FUNCTION public.get_active_users_at_location(loc_lat float, loc_lng float, radius_km float)
RETURNS integer AS $$
DECLARE
    active_count integer;
BEGIN
    SELECT COUNT(*)
    INTO active_count
    FROM public.walk_sessions
    WHERE status = 'active'
      AND route IS NOT NULL
      AND jsonb_typeof(route) = 'array'
      AND jsonb_array_length(route) > 0
      AND public.haversine_distance(
          loc_lat, 
          loc_lng, 
          (route->-1->>'lat')::float, 
          (route->-1->>'lng')::float
      ) <= radius_km;
      
    RETURN active_count;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- MOCK DATA (Opsiyonel test verisi - activity_locations)
INSERT INTO public.activity_locations (name, latitude, longitude, type)
VALUES 
    ('Yoğurtçu Parkı', 40.985, 29.030, 'park'),
    ('Moda Sahili', 40.978, 29.022, 'beach'),
    ('Caddebostan Sahil', 40.963, 29.066, 'beach'),
    ('Maçka Parkı', 41.043, 28.995, 'park')
ON CONFLICT DO NOTHING;

-- MOCK DATA (Opsiyonel test verisi - studio_assets)
INSERT INTO public.studio_assets (name, type, uses, is_prime)
VALUES 
    ('Cyberpunk Mask', 'AR Filter', 12000, true),
    ('Neon Glow', 'Photo Filter', 45000, false),
    ('Space Helmet', 'AR Asset', 3000, true),
    ('Vintage Film', 'Video Filter', 89000, false)
ON CONFLICT DO NOTHING;

-- DEFAULT PLATFORM SETTINGS
INSERT INTO public.platform_settings (key, value)
VALUES (
    'general', 
    '{"commissionRate": 10, "minPayoutAmount": 100, "maintenanceMode": false, "newRegistrations": true, "autoApprove": false}'::jsonb
) ON CONFLICT (key) DO NOTHING;
