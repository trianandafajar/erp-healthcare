alter table public.referrals
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'accepted', 'completed', 'rejected')),
  add column if not exists new_appointment_id uuid references public.appointments(id) on delete set null,
  add column if not exists updated_at timestamptz default now();
 
create trigger set_updated_at
before update on public.referrals
for each row execute function update_updated_at();
 
create index if not exists idx_referrals_status on public.referrals(status);
create index if not exists idx_referrals_new_appointment on public.referrals(new_appointment_id);