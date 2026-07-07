-- ============================================================
-- MOFFI QUEST ENGINE — Supabase Migration
-- Supabase SQL Editor'e kopyalayıp çalıştır
-- ============================================================

-- 1. Kullanıcı ekonomi tablosu (PP, XP, badges, streak shield)
CREATE TABLE IF NOT EXISTS public.user_economy (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_pp integer NOT NULL DEFAULT 0,
  total_xp integer NOT NULL DEFAULT 0,
  earned_badge_ids text[] NOT NULL DEFAULT '{}',
  weekly_stamps integer NOT NULL DEFAULT 0,
  week_start date,
  streak_shield_available boolean NOT NULL DEFAULT true,
  shield_week_start date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Günlük quest progress (her kullanıcı-gün için bir satır)
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  quests jsonb NOT NULL DEFAULT '[]',
  today_earned jsonb NOT NULL DEFAULT '{"pp":0,"xp":0}',
  social_counts jsonb NOT NULL DEFAULT '{"posts":0,"comments":0,"likes":0}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 3. Aylık araştırma progress
CREATE TABLE IF NOT EXISTS public.user_monthly_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key text NOT NULL,
  research_data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_key)
);

-- 4. Claimed rare drops (FOMO sistemi)
CREATE TABLE IF NOT EXISTS public.user_claimed_drops (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drop_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, drop_id)
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE public.user_economy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_monthly_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claimed_drops ENABLE ROW LEVEL SECURITY;

-- user_economy: kullanıcı sadece kendi satırını okuyup yazabilir
DROP POLICY IF EXISTS "user_economy_self" ON public.user_economy;
CREATE POLICY "user_economy_self" ON public.user_economy
  FOR ALL USING (auth.uid() = user_id);

-- user_quest_progress
DROP POLICY IF EXISTS "quest_progress_self" ON public.user_quest_progress;
CREATE POLICY "quest_progress_self" ON public.user_quest_progress
  FOR ALL USING (auth.uid() = user_id);

-- user_monthly_research
DROP POLICY IF EXISTS "research_self" ON public.user_monthly_research;
CREATE POLICY "research_self" ON public.user_monthly_research
  FOR ALL USING (auth.uid() = user_id);

-- user_claimed_drops
DROP POLICY IF EXISTS "drops_self" ON public.user_claimed_drops;
CREATE POLICY "drops_self" ON public.user_claimed_drops
  FOR ALL USING (auth.uid() = user_id);

-- ── AUTO-UPDATE updated_at ───────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_economy_updated_at ON public.user_economy;
CREATE TRIGGER update_user_economy_updated_at
  BEFORE UPDATE ON public.user_economy
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_quest_progress_updated_at ON public.user_quest_progress;
CREATE TRIGGER update_quest_progress_updated_at
  BEFORE UPDATE ON public.user_quest_progress
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── INDEX'LER ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quest_progress_user_date ON public.user_quest_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_monthly_research_user_month ON public.user_monthly_research(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_claimed_drops_user ON public.user_claimed_drops(user_id);

-- ── BAŞARILI ─────────────────────────────────────────────────
-- Tablolar hazır: user_economy, user_quest_progress, user_monthly_research, user_claimed_drops
