-- Her kliniğin kendi SMS sağlayıcı bilgilerini sakladığı tablo.
-- API key gibi hassas veriler burada, ASLA frontend'e döndürülmez.
CREATE TABLE IF NOT EXISTS public.clinic_sms_settings (
    clinic_id TEXT PRIMARY KEY,
    provider TEXT CHECK (provider IN ('netgsm', 'iletimerkezi', NULL)),
    api_username TEXT,
    api_key TEXT,          -- hassas, sadece service_role okur
    sender_id TEXT,         -- başlıklı SMS gönderen adı (örn. "MOFFIVET")
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

GRANT ALL ON TABLE public.clinic_sms_settings TO postgres, service_role;
-- authenticated'e GRANT YOK — klinik kendi ayarını sadece kontrollü RPC ile yazar, okuyamaz (api_key sızmasın).
ALTER TABLE public.clinic_sms_settings ENABLE ROW LEVEL SECURITY;

-- Klinik kendi ayarını YAZABİLİR ama api_key'i geri OKUYAMAZ (yazma-only pattern)
CREATE OR REPLACE FUNCTION public.set_clinic_sms_settings(
    p_provider TEXT, p_api_username TEXT, p_api_key TEXT, p_sender_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.clinic_sms_settings (clinic_id, provider, api_username, api_key, sender_id, is_active)
    VALUES (auth.uid()::text, p_provider, p_api_username, p_api_key, p_sender_id, true)
    ON CONFLICT (clinic_id) DO UPDATE
    SET provider = p_provider, api_username = p_api_username, api_key = p_api_key,
        sender_id = p_sender_id, is_active = true;
    RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_clinic_sms_settings(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Klinik SADECE "bağlı mı değil mi" bilgisini görebilir, key'i asla görmez
CREATE OR REPLACE FUNCTION public.get_my_sms_status()
RETURNS TABLE(provider TEXT, sender_id TEXT, is_active BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT s.provider, s.sender_id, s.is_active
    FROM public.clinic_sms_settings s WHERE s.clinic_id = auth.uid()::text;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_sms_status() TO authenticated;

-- Her SMS denemesinin (gerçek ya da mock) kaydı — denetim izi
CREATE TABLE IF NOT EXISTS public.sms_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unclaimed_patient_id UUID REFERENCES public.unclaimed_patients(id),
    clinic_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('mock', 'real')),
    status TEXT NOT NULL CHECK (status IN ('logged', 'sent', 'failed')),
    provider_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
GRANT ALL ON TABLE public.sms_log TO postgres, service_role;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic views own sms log" ON public.sms_log FOR SELECT TO authenticated
USING (clinic_id = auth.uid()::text);
