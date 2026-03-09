-- =====================================================
-- MOFFI - Profesyonel Kullanıcı Profili Mimarisi
-- =====================================================

-- 1. PROFILES TABLOSU
-- auth.users ile 1:1 ilişkili, kullanıcı detaylarını tutar
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    
    -- Sosyal Sayaçlar (Cache-based performans için)
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    pets_count INTEGER DEFAULT 0,
    
    -- Tercihler (JSONB ile esnek yapı)
    preferences JSONB DEFAULT '{
        "notifications": true,
        "darkMode": true,
        "language": "tr",
        "privacy": "public"
    }'::JSONB,
    
    -- Profesyonel Rozetler (Örn: 'premium', 'verified', 'vet', 'breeder')
    badges TEXT[] DEFAULT '{}',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TAKİP SİSTEMİ (Followers)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- 3. GÜVENLİK (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Profiller herkes tarafından görülebilir
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- Sadece kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Takip verileri herkes tarafından görülebilir
CREATE POLICY "Follows are viewable by everyone." 
ON public.follows FOR SELECT USING (true);

-- Sadece giriş yapanlar birini takip edebilir
CREATE POLICY "Users can follow others." 
ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Sadece takibi yapan kişi takibi bırakabilir
CREATE POLICY "Users can unfollow others." 
ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 4. OTOMATİK PROFİL OLUŞTURMA (Trigger)
-- Yeni bir kullanıcı kayıt olduğunda otomatik olarak profilini oluşturur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        new.id, 
        split_part(new.email, '@', 1) || '_' || floor(random() * 1000)::text, -- Email'den otomatik username
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. SAYAÇ GÜNCELLEME (Functions)
-- Takip etme/bırakma işlemlerinde sayıları otomatik günceller
CREATE OR REPLACE FUNCTION public.handle_follows_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_follows_count();
