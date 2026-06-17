alter table public.medical_record_files
add column title text not null default '';

alter table public.medical_record_files
alter column category set default 'document';

grant select, insert, update, delete
on table public.medical_record_files
to authenticated;

grant select, insert, update, delete
on table public.medical_record_files
to service_role;