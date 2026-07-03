insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
    'landingpage-logos',
    'landingpage-logos',
    true,
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Public can view logo images"
    on storage.objects for select
    using (bucket_id = 'landingpage-logos');

create policy "Authenticated users can upload logo images"
    on storage.objects for insert
    with check (
        bucket_id = 'landingpage-logos'
        and auth.role() = 'authenticated'
    );

create policy "Authenticated users can update logo images"
    on storage.objects for update
    using (
        bucket_id = 'landingpage-logos'
        and auth.role() = 'authenticated'
    );

create policy "Authenticated users can delete logo images"
    on storage.objects for delete
    using (
        bucket_id = 'landingpage-logos'
        and auth.role() = 'authenticated'
    );
