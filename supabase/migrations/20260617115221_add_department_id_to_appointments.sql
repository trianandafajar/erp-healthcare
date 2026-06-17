alter table public.appointments
  add column if not exists department_id uuid references public.departments(id) on delete set null;

alter table public.appointments
  alter column doctor_id drop not null;
 
create index if not exists idx_appointments_department on public.appointments(department_id);