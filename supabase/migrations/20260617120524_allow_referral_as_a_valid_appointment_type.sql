alter table public.appointments
  drop constraint if exists appointments_type_check;

alter table public.appointments
  add constraint appointments_type_check
  check (type in ('appointment', 'walkin', 'referral', 'consultation', 'follow_up'));