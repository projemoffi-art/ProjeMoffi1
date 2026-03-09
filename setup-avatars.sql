-- 1. Create a Supabase Storage Bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set Storage Policies for the 'avatars' bucket

-- Anyone can view the avatars
CREATE POLICY "Avatars are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Users can update/overwrite their own avatars (matching user folder)
CREATE POLICY "Users can update their own avatars."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1] );

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars."
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1] );
