-- ====================================================================
-- VETERİNER VE KLİNİKLER İÇİN COĞRAFİ KONUM FİLTRELEME (RPC)
-- ====================================================================
-- Supabase Dashboard -> SQL Editor paneline gidin,
-- yeni bir sorgu açıp bu kodların tamamını yapıştırın ve "Run" butonuna basın.

CREATE OR REPLACE FUNCTION public.get_nearby_clinics(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10.0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  image_url TEXT,
  rating DOUBLE PRECISION,
  review_count INT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.image_url,
    c.rating,
    c.review_count,
    c.address,
    c.lat,
    c.lng,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(c.lat)) * 
        cos(radians(c.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(c.lat))
      )
    ) AS distance_km
  FROM public.clinics c
  WHERE 
    c.lat IS NOT NULL 
    AND c.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(c.lat)) * 
        cos(radians(c.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(c.lat))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$;
