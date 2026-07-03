insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
    'landingpage-testimonials',
    'landingpage-testimonials',
    true,
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Public can view testimonial images"
    on storage.objects for select
    using (bucket_id = 'landingpage-testimonials');

create policy "Authenticated users can upload testimonial images"
    on storage.objects for insert
    with check (
        bucket_id = 'landingpage-testimonials'
        and auth.role() = 'authenticated'
    );

create policy "Authenticated users can update testimonial images"
    on storage.objects for update
    using (
        bucket_id = 'landingpage-testimonials'
        and auth.role() = 'authenticated'
    );

create policy "Authenticated users can delete testimonial images"
    on storage.objects for delete
    using (
        bucket_id = 'landingpage-testimonials'
        and auth.role() = 'authenticated'
    );
