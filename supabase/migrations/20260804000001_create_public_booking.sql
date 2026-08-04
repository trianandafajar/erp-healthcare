-- =========================
-- Public Booking feature
-- =========================

-- doctors: public booking toggle (doctor-level)
alter table public.doctors
    add column if not exists is_public_booking boolean not null default false;

-- patients: email used to reuse/auto-create patients from the public booking flow
alter table public.patients
    add column if not exists email text;

create index if not exists idx_patients_email_tenant on public.patients (email, tenant_id);

-- doctor_schedules: available hours for public booking per schedule row (nullable = falls back to schedule start/end)
alter table public.doctor_schedules
    add column if not exists public_booking_start time without time zone;

alter table public.doctor_schedules
    add column if not exists public_booking_end time without time zone;

-- tenant_settings: enabled flag + generated public URL token
alter table public.tenant_settings
    add column if not exists public_booking_enabled boolean not null default false;

alter table public.tenant_settings
    add column if not exists public_booking_token text;

create unique index if not exists idx_tenant_settings_public_booking_token
    on public.tenant_settings (public_booking_token)
    where public_booking_token is not null;

-- =========================
-- Public booking opening hours (weekly operating hours for booking)
-- =========================
create table if not exists public.public_booking_opening_hours (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    day_of_week smallint not null check (day_of_week between 0 and 6),
    start_time time without time zone not null,
    end_time time without time zone not null check (end_time > start_time),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_pbb_opening_hours_tenant on public.public_booking_opening_hours (tenant_id);

alter table public.public_booking_opening_hours enable row level security;

create policy "pbb_opening_hours_superadmin_all"
    on public.public_booking_opening_hours
    for all
    using (public.is_superadmin())
    with check (public.is_superadmin());

create policy "pbb_opening_hours_tenant_select"
    on public.public_booking_opening_hours
    for select
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

grant all on public.public_booking_opening_hours to service_role;
grant select, insert, update, delete on public.public_booking_opening_hours to authenticated;

-- =========================
-- Public booking holidays (closed dates)
-- =========================
create table if not exists public.public_booking_holidays (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    holiday_date date not null,
    name text,
    created_at timestamptz not null default now(),
    unique (tenant_id, holiday_date)
);

create index if not exists idx_pbb_holidays_tenant on public.public_booking_holidays (tenant_id);

alter table public.public_booking_holidays enable row level security;

create policy "pbb_holidays_superadmin_all"
    on public.public_booking_holidays
    for all
    using (public.is_superadmin())
    with check (public.is_superadmin());

create policy "pbb_holidays_tenant_select"
    on public.public_booking_holidays
    for select
    using (
        tenant_id = public.get_user_tenant_id()
        or public.is_superadmin()
    );

grant all on public.public_booking_holidays to service_role;
grant select, insert, update, delete on public.public_booking_holidays to authenticated;

-- =========================
-- Permission: public-booking.view
-- =========================
insert into public.permissions (name, label, module, category)
values ('public-booking.view', 'View Public Booking', 'public-booking', 'admin')
on conflict (name) do nothing;

do $$
declare
    v_role_id uuid;
    v_perm_id uuid;
begin
    select id into v_perm_id from public.permissions where name = 'public-booking.view';

    for v_role_id in
        select id from public.roles where name in ('admin', 'superadmin')
    loop
        if v_perm_id is not null then
            insert into public.role_permissions (role_id, permission_id)
            values (v_role_id, v_perm_id)
            on conflict do nothing;
        end if;
    end loop;
end $$;
