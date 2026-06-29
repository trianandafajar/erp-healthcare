-- Auto-create doctor record when a user is created with the 'doctor' role
-- Mirrors the existing 'patient' behavior in handle_new_user()

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_full_name text;
  v_role_name text;
  v_role_id uuid;
begin
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.email
  );

  insert into public.profiles (id, full_name)
  values (new.id, v_full_name)
  on conflict (id) do nothing;

  v_role_name := coalesce(new.raw_user_meta_data->>'role', 'patient');

  select id into v_role_id
  from public.roles
  where name = v_role_name;

  if v_role_id is null then
    select id into v_role_id from public.roles where name = 'patient';
  end if;

  if v_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, v_role_id)
    on conflict do nothing;
  end if;

  if v_role_name = 'patient' then
    insert into public.patients (profile_id, full_name)
    values (new.id, v_full_name)
    on conflict (profile_id) do nothing;
  end if;

  if v_role_name = 'doctor' then
    insert into public.doctors (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$function$
;
