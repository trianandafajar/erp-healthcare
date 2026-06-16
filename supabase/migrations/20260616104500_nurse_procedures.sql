create table if not exists public.nurse_procedures (
    id uuid not null default gen_random_uuid(),
    patient_id uuid not null,
    procedure_name text not null,
    scheduled_at timestamp with time zone not null,
    ended_at timestamp with time zone,
    priority text not null default 'Medium',
    status text not null default 'Planned',
    notes text,
    recorded_by uuid,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

alter table public.nurse_procedures enable row level security;

create unique index if not exists nurse_procedures_pkey on public.nurse_procedures using btree (id);
create index if not exists idx_nurse_procedures_patient on public.nurse_procedures using btree (patient_id);
create index if not exists idx_nurse_procedures_scheduled on public.nurse_procedures using btree (scheduled_at desc);

alter table public.nurse_procedures add constraint nurse_procedures_pkey primary key using index nurse_procedures_pkey;
alter table public.nurse_procedures add constraint nurse_procedures_patient_id_fkey foreign key (patient_id) references public.patients(id) on delete cascade not valid;
alter table public.nurse_procedures validate constraint nurse_procedures_patient_id_fkey;
alter table public.nurse_procedures add constraint nurse_procedures_recorded_by_fkey foreign key (recorded_by) references public.profiles(id) on delete set null not valid;
alter table public.nurse_procedures validate constraint nurse_procedures_recorded_by_fkey;
alter table public.nurse_procedures add constraint nurse_procedures_priority_check check ((priority = any (array['Low'::text, 'Medium'::text, 'High'::text]))) not valid;
alter table public.nurse_procedures validate constraint nurse_procedures_priority_check;
alter table public.nurse_procedures add constraint nurse_procedures_status_check check ((status = any (array['Planned'::text, 'In Progress'::text, 'Completed'::text]))) not valid;
alter table public.nurse_procedures validate constraint nurse_procedures_status_check;

grant select, insert, update, delete, references on table public.nurse_procedures to authenticated;
grant select, insert, update, delete, references on table public.nurse_procedures to service_role;
