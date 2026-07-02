-- =========================
-- Create tenants table
-- =========================
create table if not exists public.tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    subscription_plan text default 'free',
    subscription_status text default 'active',
    owner_id uuid references auth.users(id),
    created_at timestamptz default now()
);

alter table public.tenants enable row level security;

-- =========================
-- Add tenant_id ke profiles LEBIH DULU
-- (dibutuhkan oleh fungsi get_user_tenant_id() di bawah)
-- =========================

alter table public.profiles
    add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

create index if not exists idx_profiles_tenant_id on public.profiles (tenant_id);

-- =========================
-- Helper functions untuk RLS
-- (harus dibuat SEBELUM ada policy yang memanggilnya)
-- =========================

create or replace function public.get_user_tenant_id()
returns uuid
language sql
stable
security definer
as $$
    select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid() and r.name = 'superadmin'
    );
$$;

-- =========================
-- Add tenant_id ke sisa entity tables
-- =========================

-- patients
alter table public.patients
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_patients_tenant_id on public.patients (tenant_id);

-- doctors
alter table public.doctors
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_doctors_tenant_id on public.doctors (tenant_id);

-- nurses
alter table public.nurses
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_nurses_tenant_id on public.nurses (tenant_id);

-- departments
alter table public.departments
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_departments_tenant_id on public.departments (tenant_id);

-- doctor_schedules
alter table public.doctor_schedules
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_doctor_schedules_tenant_id on public.doctor_schedules (tenant_id);

-- nurse_schedules
alter table public.nurse_schedules
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_nurse_schedules_tenant_id on public.nurse_schedules (tenant_id);

-- appointments
alter table public.appointments
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_appointments_tenant_id on public.appointments (tenant_id);

-- medical_records
alter table public.medical_records
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_medical_records_tenant_id on public.medical_records (tenant_id);

-- prescriptions
alter table public.prescriptions
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_prescriptions_tenant_id on public.prescriptions (tenant_id);

-- referrals
alter table public.referrals
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_referrals_tenant_id on public.referrals (tenant_id);

-- activity_logs
alter table public.activity_logs
    add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

create index if not exists idx_activity_logs_tenant_id on public.activity_logs (tenant_id);

-- billing
alter table public.billing
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_billing_tenant_id on public.billing (tenant_id);

-- medical_record_files
alter table medical_record_files
    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_medrec_files_tenant_id on medical_record_files (tenant_id);

-- =========================
-- Grants
-- =========================

grant all on public.tenants to authenticated, service_role;

-- =========================
-- Policy untuk tabel tenants
-- (baru bisa dibuat sekarang, setelah fungsi tersedia)
-- =========================

create policy "superadmin_all_tenants"
    on public.tenants for all
    using (public.is_superadmin());

create policy "users_view_own_tenant"
    on public.tenants for select
    using (id = public.get_user_tenant_id());

-- =========================
-- Drop permissive RLS policies yang bypass tenant isolation
-- =========================

drop policy if exists "doctors_select_all" on public.doctors;
drop policy if exists "nurses_select_all" on public.nurses;
drop policy if exists "departments_select_all" on public.departments;
drop policy if exists "schedules_select_all" on public.doctor_schedules;
drop policy if exists "nurse_schedules_select_all" on public.nurse_schedules;

drop policy if exists "Admin can read all profiles" on public.profiles;

-- =========================
-- Tenant isolation RLS policies
-- =========================

-- Profiles: own profile, same tenant, or superadmin
create policy "profiles_tenant_isolation"
    on public.profiles for select
    using (
        id = auth.uid()
        or tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Patients: own record, same tenant staff, or superadmin
create policy "patients_tenant_isolation"
    on public.patients for all
    using (
        profile_id = auth.uid()
        or tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Doctors: same tenant or superadmin
create policy "doctors_tenant_isolation"
    on public.doctors for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Nurses: same tenant or superadmin
create policy "nurses_tenant_isolation"
    on public.nurses for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Departments: same tenant or superadmin
create policy "departments_tenant_isolation"
    on public.departments for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Doctor schedules: same tenant or superadmin
create policy "doctor_schedules_tenant_isolation"
    on public.doctor_schedules for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Nurse schedules: same tenant or superadmin
create policy "nurse_schedules_tenant_isolation"
    on public.nurse_schedules for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Appointments: same tenant or superadmin
create policy "appointments_tenant_isolation"
    on public.appointments for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Medical records: same tenant or superadmin
create policy "medical_records_tenant_isolation"
    on public.medical_records for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Prescriptions: same tenant or superadmin
create policy "prescriptions_tenant_isolation"
    on public.prescriptions for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Referrals: same tenant or superadmin
create policy "referrals_tenant_isolation"
    on public.referrals for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Activity logs: same tenant or superadmin
drop policy if exists "activity_logs_no_direct_access" on public.activity_logs;
create policy "activity_logs_tenant_isolation"
    on public.activity_logs for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Billing: same tenant or superadmin
create policy "billing_tenant_isolation"
    on public.billing for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- Medical record files: same tenant or superadmin
create policy "medrec_files_tenant_isolation"
    on medical_record_files for all
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

-- =========================
-- Update handle_new_user() untuk support multi-tenant
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_full_name text;
    v_role_name text;
    v_role_id uuid;
    v_tenant_name text;
    v_tenant_slug text;
    v_tenant_id uuid;
begin
    v_full_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        new.email
    );

    -- 1. Insert profile
    insert into public.profiles (id, full_name)
    values (new.id, v_full_name)
    on conflict (id) do nothing;

    -- 2. Create tenant if metadata contains tenant info
    v_tenant_name := new.raw_user_meta_data->>'tenant_name';
    v_tenant_slug := new.raw_user_meta_data->>'tenant_slug';

    if v_tenant_name is not null and v_tenant_slug is not null then
        insert into public.tenants (name, slug, owner_id)
        values (v_tenant_name, v_tenant_slug, new.id)
        returning id into v_tenant_id;

        update public.profiles
        set tenant_id = v_tenant_id
        where id = new.id;
    end if;

    -- 3. Role assignment
    v_role_name := coalesce(new.raw_user_meta_data->>'role', 'patient');

    select id into v_role_id
    from public.roles
    where name = v_role_name;

    if v_role_id is null then
        select id into v_role_id from public.roles where name = 'patient';
    end if;

    if v_role_id is not null then
        insert into public.user_roles (user_id, role_id)
        values (new.id, v_role_id)
        on conflict do nothing;
    end if;

    -- 4. Auto-create patient record
    if v_role_name = 'patient' then
        insert into public.patients (profile_id, full_name, tenant_id)
        values (new.id, v_full_name, v_tenant_id)
        on conflict (profile_id) do nothing;
    end if;

    -- 5. Auto-create doctor record
    if v_role_name = 'doctor' then
        insert into public.doctors (id, tenant_id)
        values (new.id, v_tenant_id)
        on conflict (id) do nothing;
    end if;

    return new;
end;
$function$;