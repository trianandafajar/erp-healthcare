-- STORAGE BUCKET
insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'medical-records',
    'medical-records',
    false,
    10485760, -- 10 MB
    array[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
on conflict (id) do nothing;

-- UPLOAD
create policy "medical_records_upload"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'medical-records'
);

-- VIEW
create policy "medical_records_view"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'medical-records'
);

-- UPDATE
create policy "medical_records_update"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'medical-records'
)
with check (
    bucket_id = 'medical-records'
);

-- DELETE
create policy "medical_records_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'medical-records'
);