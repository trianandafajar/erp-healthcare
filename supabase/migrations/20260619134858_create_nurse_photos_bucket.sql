INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'nurse-photos',
    'nurse-photos',
    true,
    2097152, -- 2 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view nurse photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'nurse-photos');

CREATE POLICY "Authenticated users can upload nurse photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nurse-photos');

CREATE POLICY "Authenticated users can update nurse photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'nurse-photos');

CREATE POLICY "Authenticated users can delete nurse photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'nurse-photos');