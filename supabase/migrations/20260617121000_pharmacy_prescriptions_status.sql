do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'prescriptions'
      and policyname = 'pharmacy_prescriptions_select_pharmacy'
  ) then
    create policy "pharmacy_prescriptions_select_pharmacy"
    on "public"."prescriptions"
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name = 'pharmacy'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'prescriptions'
      and policyname = 'pharmacy_prescriptions_update_pharmacy'
  ) then
    create policy "pharmacy_prescriptions_update_pharmacy"
    on "public"."prescriptions"
    for update
    to authenticated
    using (
      exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name = 'pharmacy'
      )
    )
    with check (
      exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name = 'pharmacy'
      )
    );
  end if;
end $$;