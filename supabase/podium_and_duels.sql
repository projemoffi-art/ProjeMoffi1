-- ============================================================
-- MOFFI PODYUM & DÜELLO SİSTEMİ
-- ============================================================

-- 1. PODYUM TABLOSU
-- #podyum etiketli postlar otomatik aday olur
CREATE TABLE IF NOT EXISTS public.podium_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID,               -- bağlı post (opsiyonel)
    owner_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id          UUID,               -- REFERENCES pets(id) ON DELETE CASCADE
    photo_url       TEXT NOT NULL,
    caption         TEXT,
    week_start      DATE NOT NULL,      -- her haftanın Pazartesi tarihi
    vote_count      INT DEFAULT 0,
    rank            INT,                -- 1,2,3 veya NULL
    coin_rewarded   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Podyum oy tablosu (günde 1 oy limiti için)
CREATE TABLE IF NOT EXISTS public.podium_votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id        UUID REFERENCES public.podium_entries(id) ON DELETE CASCADE,
    voter_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    voted_at        DATE DEFAULT CURRENT_DATE,
    UNIQUE(entry_id, voter_id, voted_at)  -- günde 1 oy
);

-- 2. DÜELLO TABLOSU
CREATE TABLE IF NOT EXISTS public.duels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenger_pet_id   UUID,
    opponent_pet_id     UUID,
    topic               TEXT NOT NULL,              -- "En güzel uyku pozu"
    challenger_photo    TEXT,
    opponent_photo      TEXT,
    challenger_votes    INT DEFAULT 0,
    opponent_votes      INT DEFAULT 0,
    status              TEXT DEFAULT 'pending',     -- pending|active|completed|declined
    winner_id           UUID,                       -- kazanan user_id
    ends_at             TIMESTAMPTZ NOT NULL,
    coin_rewarded       BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Düello oy tablosu (kullanıcı başına 1 oy)
CREATE TABLE IF NOT EXISTS public.duel_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duel_id     UUID REFERENCES public.duels(id) ON DELETE CASCADE,
    voter_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    voted_for   TEXT NOT NULL,  -- 'challenger' | 'opponent'
    voted_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(duel_id, voter_id)   -- her düelloda 1 oy
);

-- 3. RLS POLİTİKALARI
ALTER TABLE public.podium_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podium_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_votes ENABLE ROW LEVEL SECURITY;

-- Podyum: herkes okuyabilir, sahip yönetir
CREATE POLICY "Podium entries are public" ON public.podium_entries FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own podium entries" ON public.podium_entries FOR ALL TO authenticated
    USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Podium votes are public" ON public.podium_votes FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own votes" ON public.podium_votes FOR ALL TO authenticated
    USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

-- Düello: herkes okuyabilir, taraflar yönetir
CREATE POLICY "Duels are public" ON public.duels FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own duels" ON public.duels FOR ALL TO authenticated
    USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

CREATE POLICY "Duel votes are public" ON public.duel_votes FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own duel votes" ON public.duel_votes FOR ALL TO authenticated
    USING (voter_id = auth.uid()) WITH CHECK (voter_id = auth.uid());

-- 4. FONKSİYON: Haftalık podyum sıralaması otomatik hesapla
CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS DATE AS $$
    SELECT date_trunc('week', CURRENT_DATE)::DATE;
$$ LANGUAGE SQL STABLE;

-- 5. Supabase realtime için publication'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE public.podium_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_votes;
