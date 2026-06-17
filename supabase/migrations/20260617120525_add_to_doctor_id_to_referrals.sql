alter table public.referrals
  add column if not exists to_doctor_id uuid references public.doctors(id) on delete set null;

create index if not exists idx_referrals_to_doctor on public.referrals(to_doctor_id);