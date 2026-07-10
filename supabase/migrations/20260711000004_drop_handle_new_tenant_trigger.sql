drop trigger if exists trg_after_insert_tenant on public.tenants;
drop function if exists public.handle_new_tenant();
