INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landingpage-industries',
    'landingpage-industries',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view industry images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'landingpage-industries');

CREATE POLICY "Authenticated users can upload industry images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'landingpage-industries');

CREATE POLICY "Authenticated users can update industry images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'landingpage-industries');

CREATE POLICY "Authenticated users can delete industry images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'landingpage-industries');
