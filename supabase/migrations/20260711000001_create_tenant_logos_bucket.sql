INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'tenant-logos',
    'tenant-logos',
    true,
    false,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view tenant logo images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'tenant-logos');

CREATE POLICY "Authenticated users can upload tenant logo images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'tenant-logos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update tenant logo images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'tenant-logos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete tenant logo images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'tenant-logos'
        AND auth.role() = 'authenticated'
    );
