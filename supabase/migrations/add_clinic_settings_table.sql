-- ====================================================================
-- CLINIC SETTINGS (KLİNİK VARDİYA VE TAKVİM AYARLARI) TABLOSU YAMASI
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    clinic_id TEXT PRIMARY KEY,
    working_days JSONB,
    start_time TEXT,
    end_time TEXT,
    lunch_start TEXT,
    lunch_end TEXT,
    slot_duration INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Erişim yetkilerini tanımla
GRANT ALL ON TABLE public.clinic_settings TO postgres, service_role, authenticated, anon;

-- Satır Bazlı Güvenlik (RLS) Etkinleştirme
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Okuma Politikası: Herkes klinik ayarlarını okuyabilir (Müşterilerin saat slotlarını görebilmesi için)
DROP POLICY IF EXISTS "Allow select for everyone on clinic_settings" ON public.clinic_settings;
CREATE POLICY "Allow select for everyone on clinic_settings" 
ON public.clinic_settings FOR SELECT 
TO authenticated, anon 
USING (true);

-- Yazma/Güncelleme Politikası: Sadece clinic_id sahibi kendisini güncelleyebilir
DROP POLICY IF EXISTS "Allow all for authenticated/anon on clinic_settings" ON public.clinic_settings;
CREATE POLICY "Allow all for authenticated/anon on clinic_settings" 
ON public.clinic_settings FOR ALL 
TO authenticated 
USING (auth.uid()::text = clinic_id)
WITH CHECK (auth.uid()::text = clinic_id);

-- Realtime yayını
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'clinic_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_settings;
    END IF;
END $$;
