alter table public.doctor_schedules
    add column if not exists public_booking_enabled boolean not null default false;
