INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-avatars',
    'profile-avatars',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view profile avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated users can upload profile avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated users can update profile avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated users can delete profile avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-avatars');

ALTER TABLE doctors DROP COLUMN IF EXISTS photo_url;
ALTER TABLE nurses DROP COLUMN IF EXISTS photo_url;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;