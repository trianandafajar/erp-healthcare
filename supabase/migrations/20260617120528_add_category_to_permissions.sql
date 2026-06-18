alter table public.permissions
  add column if not exists category text;

alter table public.permissions
  add constraint permissions_category_check
  check (category is null or category in ('admin', 'doctor', 'nurse', 'patient', 'pharmacy', 'receptionist'));

create index if not exists idx_permissions_category on public.permissions(category);