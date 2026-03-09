-- =====================================================
-- MOFFI - AI Moderasyon + İhbar Sistemi
-- Supabase SQL Editor'de çalıştırın
-- =====================================================

-- 1. adoption_ads tablosuna moderasyon sütunları ekle
ALTER TABLE adoption_ads 
ADD COLUMN IF NOT EXISTS moderation_result TEXT,
ADD COLUMN IF NOT EXISTS moderation_passed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- 2. adoption_reports tablosu oluştur
CREATE TABLE IF NOT EXISTS adoption_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id UUID REFERENCES adoption_ads(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('fee_request', 'fake_ad', 'inappropriate', 'animal_sale', 'other')),
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS - adoption_reports
ALTER TABLE adoption_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create reports" ON adoption_reports;
CREATE POLICY "Anyone can create reports"
    ON adoption_reports FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view all reports" ON adoption_reports;
CREATE POLICY "Reporters can see their own reports"
    ON adoption_reports FOR SELECT
    USING (reported_by = auth.uid());

-- 4. Admin view (tüm ilanları ve moderasyon durumlarını görmek için)
CREATE OR REPLACE VIEW adoption_ads_admin AS
SELECT 
    a.*,
    COUNT(r.id) as report_count,
    array_agg(DISTINCT r.reason) FILTER (WHERE r.reason IS NOT NULL) as report_reasons
FROM adoption_ads a
LEFT JOIN adoption_reports r ON r.ad_id = a.id
GROUP BY a.id;
