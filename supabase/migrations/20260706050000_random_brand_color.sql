create or replace function public.handle_new_tenant()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_colors text[] := ARRAY[
        '#176D37', '#1976d2', '#7b1fa2', '#c62828', '#e65100',
        '#00838f', '#37474f', '#2e7d32', '#4a148c', '#01579b',
        '#bf360c', '#1b5e20', '#311b92', '#00695c', '#b71c1c',
        '#283593', '#827717', '#4e342e', '#5d4037', '#1565c0'
    ];
    v_color text;
begin
    v_color := v_colors[floor(random() * array_length(v_colors, 1)) + 1];

    insert into public.tenant_subscriptions (tenant_id, plan, status, trial_ends, start_date)
    values (new.id, 'free', 'trial', now() + interval '7 days', now());

    update public.tenants
    set brand_color = v_color
    where id = new.id;

    return new;
end;
$function$;
