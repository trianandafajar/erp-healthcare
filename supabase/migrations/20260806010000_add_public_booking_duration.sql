-- =========================
-- Public booking: doctor sets duration per examination instead of online hours
-- =========================

-- Doctor no longer sets public booking start/end hours; the online window now
-- follows the tenant opening hours (public_booking_opening_hours). The doctor
-- only sets how many minutes each examination takes.
alter table public.doctor_schedules
    add column if not exists public_booking_duration_minutes int;

-- Backfill existing enabled schedules to the previous 30-minute slot behaviour
update public.doctor_schedules
set public_booking_duration_minutes = 30
where public_booking_enabled = true
  and public_booking_duration_minutes is null;

-- Duration must be a sane positive number when provided
alter table public.doctor_schedules
    add constraint chk_doctor_schedules_public_booking_duration
    check (
        public_booking_duration_minutes is null
        or public_booking_duration_minutes between 5 and 600
    );

-- Duration is required whenever public booking is enabled for the day
alter table public.doctor_schedules
    add constraint chk_doctor_schedules_public_booking_duration_required
    check (
        not public_booking_enabled
        or public_booking_duration_minutes is not null
    );

-- Remove the obsolete per-day public booking hours override
alter table public.doctor_schedules
    drop column if exists public_booking_start;

alter table public.doctor_schedules
    drop column if exists public_booking_end;
