-- 1. Reports Tablosu İçin Güvenlik Ayarları
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Şikayet gönderebilmek için izin
CREATE POLICY "Herkes şikayet gönderebilir" 
ON public.reports 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Admin panelinin şikayetleri okuyabilmesi için izin
CREATE POLICY "Admin paneli şikayetleri okuyabilir" 
ON public.reports 
FOR SELECT 
TO public 
USING (true);

-- 2. İlan Şikayetleri (Adoption Reports) Tablosu İçin Güvenlik Ayarları
ALTER TABLE public.adoption_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes ilan şikayeti gönderebilir" 
ON public.adoption_reports 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Admin paneli ilan şikayetlerini okuyabilir" 
ON public.adoption_reports 
FOR SELECT 
TO public 
USING (true);
