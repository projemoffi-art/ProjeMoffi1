-- LOST_PETS VE ADOPTION_PETS TABLOLARINA ÇOKLU FOTOĞRAF DESTEĞİ MİGRASYONU
-- Bu betik, ilanlarda birden fazla fotoğraf saklayabilmek için images dizisi ekler.

-- 1. lost_pets Tablosuna images Kolonunu Ekle
ALTER TABLE public.lost_pets ADD COLUMN IF NOT EXISTS images TEXT[];

-- 2. adoption_pets Tablosuna images Kolonunu Ekle
ALTER TABLE public.adoption_pets ADD COLUMN IF NOT EXISTS images TEXT[];
