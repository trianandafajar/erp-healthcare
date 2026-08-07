-- Prevent double-booking the same doctor, date and time slot.
-- Applies only to active (waiting / in_progress) appointments so that a
-- cancelled or completed appointment does not block the slot permanently.

-- 1. Dedupe existing active appointments: keep the earliest created one per
--    (doctor_id, appointment_date, appointment_time), cancel the rest.
with ranked as (
    select
        id,
        row_number() over (
            partition by doctor_id, appointment_date, appointment_time
            order by created_at asc, id asc
        ) as rn
    from public.appointments
    where status in ('waiting', 'in_progress')
      and appointment_time is not null
)
update public.appointments a
set status = 'cancelled'
from ranked r
where a.id = r.id
  and r.rn > 1;

-- 2. Enforce uniqueness for active appointments on the same slot.
create unique index if not exists uq_appointments_doctor_date_time_active
    on public.appointments (doctor_id, appointment_date, appointment_time)
    where status in ('waiting', 'in_progress')
      and appointment_time is not null;
