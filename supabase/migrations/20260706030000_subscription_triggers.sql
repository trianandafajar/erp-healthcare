-- =====================================================
-- Trigger 1: auto-create subscription when tenant is created
-- =====================================================

create or replace function public.handle_new_tenant()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
    insert into public.tenant_subscriptions (tenant_id, plan, status, trial_ends, start_date)
    values (new.id, 'free', 'trial', now() + interval '7 days', now());
    return new;
end;
$function$;

drop trigger if exists trg_after_insert_tenant on public.tenants;

create trigger trg_after_insert_tenant
    after insert on public.tenants
    for each row
    execute function public.handle_new_tenant();

-- =====================================================
-- Trigger 2: sync plan/status back to tenants table
-- =====================================================

create or replace function public.sync_tenant_subscription()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
    update public.tenants
    set subscription_plan = new.plan,
        subscription_status = new.status
    where id = new.tenant_id;
    return new;
end;
$function$;

drop trigger if exists trg_after_upsert_tenant_subscription on public.tenant_subscriptions;

create trigger trg_after_upsert_tenant_subscription
    after insert or update on public.tenant_subscriptions
    for each row
    execute function public.sync_tenant_subscription();
