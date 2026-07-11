create table if not exists public.patient_admissions (
    id uuid not null default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    email text,
    description text,
    length_of_stay text,
    admission_date timestamptz default now(),
    tenant_id uuid references public.tenants(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.patient_admissions enable row level security;

create index if not exists idx_patient_admissions_patient on public.patient_admissions (patient_id);
create index if not exists idx_patient_admissions_tenant on public.patient_admissions (tenant_id);

create trigger set_updated_at_patient_admissions
    before update on public.patient_admissions
    for each row
    execute function public.update_updated_at();

create policy "patient_admissions_tenant_isolation"
    on public.patient_admissions for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

alter publication supabase_realtime add table public.patient_admissions;

grant all on public.patient_admissions to authenticated, service_role;
