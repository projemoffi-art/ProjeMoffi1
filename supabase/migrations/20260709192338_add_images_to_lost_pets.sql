ALTER TABLE lost_pets ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
