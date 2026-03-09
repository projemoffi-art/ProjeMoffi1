-- 1. Create the 'stories' table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for the 'stories' table

-- Anyone can see stories
CREATE POLICY "Stories are viewable by everyone." 
ON public.stories FOR SELECT 
USING (true);

-- Authenticated users can insert their own stories
CREATE POLICY "Users can insert their own stories." 
ON public.stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories." 
ON public.stories FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Create a Supabase Storage Bucket for stories media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-media', 'story-media', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set Storage Policies for the 'story-media' bucket

-- Anyone can view the story images
CREATE POLICY "Story media is publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'story-media' );

-- Users can upload images to the story bucket
CREATE POLICY "Users can upload story media."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'story-media' AND auth.role() = 'authenticated' );

-- Users can delete their own uploaded story media
-- We match by folder if you structure it like: userId/filename
CREATE POLICY "Users can delete own story media."
ON storage.objects FOR DELETE
USING ( bucket_id = 'story-media' AND auth.uid() = owner );
