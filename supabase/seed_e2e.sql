-- =====================================================================
-- E2E test seed (Playwright)
-- Run AFTER supabase/seed.sql + supabase/seed_dummy.sql so that the
-- auth users, roles, doctors, schedules and patients already exist.
-- Creates a tenant, links all demo users to it, and enables the
-- public booking flow used by e2e/public-booking.spec.ts.
-- Default password for every demo user: Password123!
-- Public booking token: e2e-booking
-- =====================================================================

begin;

-- -------------------------------------------------------------------
-- Tenant
-- -------------------------------------------------------------------
insert into public.tenants (id, name, slug, subscription_plan, subscription_status, owner_id, brand_color)
values (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Demo Clinic',
    'demo-clinic',
    'pro',
    'active',
    '11111111-1111-1111-1111-111111111111',
    '#176D37'
)
on conflict (slug) do update
set name = excluded.name,
    subscription_plan = excluded.subscription_plan,
    subscription_status = excluded.subscription_status,
    brand_color = excluded.brand_color;

-- -------------------------------------------------------------------
-- Tenant subscription (no unique key on tenant_id -> delete + insert)
-- -------------------------------------------------------------------
delete from public.tenant_subscriptions where tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

insert into public.tenant_subscriptions (tenant_id, plan, status, billing_cycle, amount, currency, start_date)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'pro', 'active', 'monthly', 99, 'USD', now());

-- -------------------------------------------------------------------
-- Link demo users to the tenant (profile + role safety net)
-- -------------------------------------------------------------------
update public.profiles
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
where id in (
    '11111111-1111-1111-1111-111111111111', -- admin@demo.local
    '22222222-2222-2222-2222-222222222222', -- doctor.andi@demo.local
    '22222222-2222-2222-2222-222222222223', -- doctor.sarah@demo.local
    '33333333-3333-3333-3333-333333333333', -- nurse.lisa@demo.local
    '44444444-4444-4444-4444-444444444444', -- pharmacy@demo.local
    '55555555-5555-5555-5555-555555555555'  -- patient.siti@demo.local
);

insert into public.user_roles (user_id, role_id)
select '11111111-1111-1111-1111-111111111111', id from public.roles where name = 'admin'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '22222222-2222-2222-2222-222222222222', id from public.roles where name = 'doctor'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '22222222-2222-2222-2222-222222222223', id from public.roles where name = 'doctor'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '33333333-3333-3333-3333-333333333333', id from public.roles where name = 'nurse'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '44444444-4444-4444-4444-444444444444', id from public.roles where name = 'pharmacy'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '55555555-5555-5555-5555-555555555555', id from public.roles where name = 'patient'
on conflict do nothing;

-- -------------------------------------------------------------------
-- Tenant-wide entity ownership
-- -------------------------------------------------------------------
update public.departments
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.doctors
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    is_public_booking = true;

update public.doctor_schedules
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    public_booking_enabled = true,
    public_booking_duration_minutes = 30;

update public.nurses
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.patients
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.appointments
set tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- -------------------------------------------------------------------
-- Tenant settings: enable public booking with a fixed token
-- -------------------------------------------------------------------
insert into public.tenant_settings (tenant_id, display_name, logo_url, public_booking_enabled, public_booking_token)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Demo Clinic', null, true, 'e2e-booking')
on conflict (tenant_id) do update
set display_name = excluded.display_name,
    public_booking_enabled = true,
    public_booking_token = 'e2e-booking';

-- -------------------------------------------------------------------
-- Public booking opening hours (open every day 08:00 - 17:00)
-- -------------------------------------------------------------------
delete from public.public_booking_opening_hours where tenant_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

insert into public.public_booking_opening_hours (tenant_id, day_of_week, start_time, end_time, is_active)
values
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 0, '08:00', '17:00', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, '08:00', '17:00', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 2, '08:00', '17:00', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 3, '08:00', '17:00', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 4, '08:00', '17:00', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 5, '08:00', '17:00', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 6, '08:00', '17:00', true);

commit;
