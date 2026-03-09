-- ==========================================
-- MOFFI APPLE-CALIBER SMART PET-ID ARCHITECTURE (FINAL V2)
-- Includes: Hardware Tags, Privacy Proxies, Co-Ownership, Bounties, Soft-Delete
-- ==========================================

-- 1. EVCİL HAYVAN ÇEKİRDEK TABLOSU (Core Pets Table)
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- "Apple Family Sharing" -> Ortak Sahiplik (Aile Bireyleri vb.)
    co_owners UUID[] DEFAULT '{}', 
    
    -- Moffi Hardware (Donanım) Vizyonu
    hardware_tag_id TEXT UNIQUE,  -- 'MF-XYZ987' Fiziksel tasma alındığında bu ID buraya yazılır
    
    -- Temel Kimlik Bilgileri
    name TEXT NOT NULL,
    type TEXT NOT NULL,           -- Kedi, Köpek vs.
    breed TEXT,                   -- Golden Retriever vs.
    age TEXT,                     -- 2 Yaş
    gender TEXT DEFAULT 'Erkek',
    is_neutered BOOLEAN DEFAULT true,
    size TEXT DEFAULT 'Orta',
    
    -- Tıbbi & Ayırt Edici Bilgiler
    features TEXT,                -- 'Sol kulağı yırtık'
    health_notes TEXT,            -- 'Kritik: Tavuk alerjisi!'
    character_notes TEXT,         -- 'Çok uysal ama arabalardan korkar.'
    
    -- Medya & Fotoğraflar
    photos TEXT[] DEFAULT '{}',
    cover_photo TEXT,
    
    -- Resmi Belgeler
    microchip_number TEXT,        -- 'TR-000000'
    
    -- GİZLİLİK VE İLETİŞİM (Privacy by Design)
    -- Seçenekler: 'public_phone' (numarayı göster), 'anonymous_only' (sadece mesaj)
    communication_preference TEXT DEFAULT 'anonymous_only', 
    
    -- CAN ALICI NOKTA: Kayıp Alarmı Durumu ve Konumu
    status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'lost')),
    last_seen_location_text TEXT, -- İlan verildiği andaki veya en son okutulan bölge (Örn: 'Kadıköy Moda')
    last_seen_lat DOUBLE PRECISION,
    last_seen_lng DOUBLE PRECISION,

    -- ÖDÜL SİSTEMİ (Bounty/Reward)
    lost_reward_amount NUMERIC DEFAULT 0,  -- Bulana verilecek para ödülü miktarı (Örn: 5000)
    lost_reward_currency TEXT DEFAULT 'TL', -- Para birimi

    -- GÜVENLİK & YÖNETİM (Soft Delete)
    is_deleted BOOLEAN DEFAULT false,    -- Kütüphaneden silinse bile 30 gün boyunca donanım bağını korur
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Meta Zamanlar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Politikalar (Pets)

-- A. Herkes görebilir (QR Okutanlar için hayati ama sadece 'silinmemiş' olanları!)
CREATE POLICY "Pets are viewable by everyone." 
ON public.pets FOR SELECT USING (is_deleted = false);

-- B. Sadece Sahibinin Yetkileri (Insert)
CREATE POLICY "Users can insert their own pets." 
ON public.pets FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- C. "Apple Family Sharing": Sahibi VEYA Ortak Sahibi (Co-owner) hayvanı güncelleyebilir!
CREATE POLICY "Owners and co-owners can update their pets." 
ON public.pets FOR UPDATE 
USING (
    auth.uid() = owner_id OR 
    auth.uid() = ANY(co_owners)
);

-- D. Hayvanı SADECE ASIL SAHİBİ ('owner_id') silebilir (Diğerleri silemez)
CREATE POLICY "Only main owner can delete their pets." 
ON public.pets FOR DELETE 
USING (auth.uid() = owner_id);


-- ==========================================
-- 2. İHBAR VE KONUM LOGLARI TABLOSU (SOS Logs)
-- Apple Find My benzeri bir sinyal/ping altyapısı
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pet_sos_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
    
    -- Bulan Kişinin (İhbarcının) İlettiği Veriler
    reporter_message TEXT,          -- Anonim mesajı ("Burada besliyorum")
    reported_lat DOUBLE PRECISION,  -- İhbarcının gönderdiği konum enlemi
    reported_lng DOUBLE PRECISION,  -- İhbarcının gönderdiği konum boylamı
    reported_location_text TEXT,    -- Adres metni
    
    -- Cihaz Anonim Verisi (Kötüye kullanımı engellemek için)
    reporter_device_id TEXT,        -- İhbarcının tarayıcı/cihaz hash'i
    
    is_read BOOLEAN DEFAULT false,  -- Sahibi bu ihbarı/mesajı gördü mü?
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.pet_sos_logs ENABLE ROW LEVEL SECURITY;

-- Politikalar (SOS Logs)

-- A. Herkes (Giriş yapmamış bile olsa) anonim mesaj/konum atabilir! (İhbar edebilmeli)
CREATE POLICY "Anyone can insert anonymous SOS log." 
ON public.pet_sos_logs FOR INSERT 
WITH CHECK (true);

-- B. Sadece hayvanın gerçek SAHİBİ veya ORTAK SAHİBİ kendi hayvanına gelen ihbar mesajlarını okuyabilir!
CREATE POLICY "Only the owner or co-owner can read SOS messages." 
ON public.pet_sos_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.pets
        WHERE pets.id = pet_sos_logs.pet_id AND (pets.owner_id = auth.uid() OR auth.uid() = ANY(pets.co_owners))
    )
);

-- C. Sahibi/Ortak Sahibi mesajı 'okundu' yapması (Update)
CREATE POLICY "Only the owner or co-owner can update SOS messages." 
ON public.pet_sos_logs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.pets
        WHERE pets.id = pet_sos_logs.pet_id AND (pets.owner_id = auth.uid() OR auth.uid() = ANY(pets.co_owners))
    )
);
