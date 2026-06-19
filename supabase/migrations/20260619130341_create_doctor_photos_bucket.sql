INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'doctor-photos',
    'doctor-photos',
    true,
    2097152, -- 2 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view doctor photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can upload doctor photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can update doctor photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can delete doctor photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-photos');