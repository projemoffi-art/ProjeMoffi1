-- =====================================================
-- MOFFI - Profesyonel Sahiplendirme Akışı (Adoption Workflow)
-- =====================================================

-- 1. SAHİPLENME BAŞVURULARI (Applications)
-- Bir ilana talip olan kişilerin başvurularını tutar
CREATE TABLE IF NOT EXISTS public.adoption_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id UUID REFERENCES public.adoption_ads(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Başvuru Durumu
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    
    -- Başvuru Detayları (Apple-Style Form Verisi)
    applicant_notes TEXT,            -- "Neden sahiplenmek istiyor?"
    experience_level TEXT,          -- "Daha önce baktı mı?"
    home_condition TEXT,            -- "Bahçeli/Apartman"
    has_other_pets BOOLEAN DEFAULT false,
    
    -- İletişim Tercihi (Gizlilik Koruma)
    contact_method TEXT DEFAULT 'in_app_chat', -- in_app_chat, phone, email
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(ad_id, applicant_id) -- Bir kullanıcı bir ilana sadece bir kez başvurabilir
);

-- 2. SAHİPLİK TRANSFER LOGLARI (Ownership Transfer)
-- Hayvanın el değiştirmesinin resmi kaydı
CREATE TABLE IF NOT EXISTS public.pet_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.adoption_applications(id) ON DELETE SET NULL,
    
    from_owner_id UUID REFERENCES auth.users(id) NOT NULL,
    to_owner_id UUID REFERENCES auth.users(id) NOT NULL,
    
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Transfer Notu (Örn: "Moffi artık yeni yuvasında")
    transfer_note TEXT
);

-- 3. GÜVENLİK (RLS)
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_transfers ENABLE ROW LEVEL SECURITY;

-- Başvuruları sadece ilanı veren (ilan sahibi) ve başvuruyu yapan görebilir
CREATE POLICY "Users can see relevant applications." 
ON public.adoption_applications FOR SELECT 
USING (
    auth.uid() = applicant_id OR 
    EXISTS (
        SELECT 1 FROM public.adoption_ads 
        WHERE adoption_ads.id = ad_id AND adoption_ads.user_id = auth.uid()
    )
);

-- Sadece giriş yapanlar başvuru yapabilir
CREATE POLICY "Authenticated users can apply." 
ON public.adoption_applications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Sadece ilan sahibi başvuruyu güncelleyebilir (Onay/Red)
CREATE POLICY "Ad owners can update application status." 
ON public.adoption_applications FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.adoption_ads 
        WHERE adoption_ads.id = ad_id AND adoption_ads.user_id = auth.uid()
    )
);

-- Transfer kayıtlarını sadece taraflar görebilir
CREATE POLICY "Transfer parties can view logs." 
ON public.pet_transfers FOR SELECT 
USING (auth.uid() = from_owner_id OR auth.uid() = to_owner_id);

-- 4. OTOMATİK TRANSFER FONKSİYONU (Function)
-- Bir başvuru 'approved' olduğunda ilanı kapatır ve sahiplik transferini başlatır
CREATE OR REPLACE FUNCTION public.handle_adoption_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer durum 'approved' (Onaylandı) çekildiyse
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        
        -- 1. İlanı 'adopted' (Sahiplendirildi) durumuna çek
        UPDATE public.adoption_ads SET status = 'adopted' WHERE id = NEW.ad_id;
        
        -- 2. Diğer tüm bekleyen başvuruları otomatik reddet
        UPDATE public.adoption_applications 
        SET status = 'rejected' 
        WHERE ad_id = NEW.ad_id AND id <> NEW.id AND status = 'pending';

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_adoption_approved
    AFTER UPDATE ON public.adoption_applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_adoption_approval();
