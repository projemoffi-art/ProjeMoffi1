-- Moffi Akıllı Pet-ID Veritabanı Mimarisi

-- 1. `pets` Tablosu
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Temel Kimlik
    name TEXT NOT NULL,
    type TEXT NOT NULL,           -- Kedi, Köpek vs.
    breed TEXT,                   -- Golden Retriever
    age TEXT,                     -- 2 Yaş
    gender TEXT DEFAULT 'Erkek',
    is_neutered BOOLEAN DEFAULT true,
    size TEXT DEFAULT 'Orta',
    
    -- Karakter ve Fiziksel Özellikler
    features TEXT,                -- 'Kulağı yırtık vs.'
    health_notes TEXT,            -- 'Tavuk alerjisi!'
    character_notes TEXT,         -- 'Uysal'
    
    -- Güvenlik ve Teknik Donanım
    microchip_number TEXT,        -- 'TR-000000'
    show_owner_phone BOOLEAN DEFAULT false,
    photos TEXT[] DEFAULT '{}',   -- Fotoğraf linkleri dizisi
    cover_photo TEXT,             -- Kapak fotoğrafı referansı
    
    -- CAN ALICI NOKTA: Kayıp Durumu
    status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'lost')),
    
    -- Tarihler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Açma
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- 2. Sorgular İçin Güvenlik Politikaları (Policies)

-- A. "Pets are viewable by everyone" (QR Okutan veya profil gezen herkes o hayvanın sayfasını okuyabilmeli!)
CREATE POLICY "Pets are viewable by everyone." 
ON public.pets FOR SELECT 
USING (true);

-- B. "Users can insert their own pets" (Sadece giriş yapmış kullanıcılar kendi hayvanlarını kaydedebilir)
CREATE POLICY "Users can insert their own pets." 
ON public.pets FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- C. "Users can update their own pets" (Sadece hayvanın sahibi 'Safe' veya 'Lost' durumuna geçirebilir!)
CREATE POLICY "Users can update their own pets." 
ON public.pets FOR UPDATE 
USING (auth.uid() = owner_id);

-- D. "Users can delete their own pets"
CREATE POLICY "Users can delete their own pets." 
ON public.pets FOR DELETE 
USING (auth.uid() = owner_id);

-- 3. Fotoğraflar İçin Storage (Depo) Kova Oluşturma
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-media', 'pet-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Politikaları
CREATE POLICY "Pet media is publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'pet-media' );

CREATE POLICY "Users can upload pet media."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'pet-media' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can edit own pet media."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'pet-media' AND auth.uid() = owner );

CREATE POLICY "Users can delete own pet media."
ON storage.objects FOR DELETE
USING ( bucket_id = 'pet-media' AND auth.uid() = owner );
