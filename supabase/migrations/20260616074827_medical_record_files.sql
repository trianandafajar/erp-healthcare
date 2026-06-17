create extension if not exists "uuid-ossp";

create table if not exists medical_record_files (
    id uuid primary key default gen_random_uuid(),

    medical_record_id uuid not null references medical_records(id) on delete cascade,

    file_name text not null,
    file_url text not null,

    file_type text,
    file_size integer,

    category text default 'general', 

    uploaded_by uuid,

    created_at timestamp with time zone default now()
);

create index if not exists idx_medrec_files_medical_record_id
on medical_record_files (medical_record_id);

create index if not exists idx_medrec_files_category
on medical_record_files (category);