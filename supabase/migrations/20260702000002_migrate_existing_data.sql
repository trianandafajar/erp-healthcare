-- =========================
-- Migrate existing data to default tenant
-- =========================

do $$
declare
    v_default_tenant_id uuid;
begin
    -- 1. Create default tenant for all existing data
    insert into public.tenants (name, slug)
    values ('Default', 'default')
    on conflict (slug) do nothing
    returning id into v_default_tenant_id;

    -- If already exists, fetch it
    if v_default_tenant_id is null then
        select id into v_default_tenant_id
        from public.tenants
        where slug = 'default';
    end if;

    -- 2. Update profiles
    update public.profiles
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 3. Update patients
    update public.patients
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 4. Update doctors
    update public.doctors
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 5. Update nurses
    update public.nurses
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 6. Update departments
    update public.departments
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 7. Update doctor_schedules (set from doctor's tenant)
    update public.doctor_schedules ds
    set tenant_id = d.tenant_id
    from public.doctors d
    where ds.doctor_id = d.id and ds.tenant_id is null;

    -- fallback for any remaining
    update public.doctor_schedules
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 8. Update nurse_schedules (set from nurse's tenant)
    update public.nurse_schedules ns
    set tenant_id = n.tenant_id
    from public.nurses n
    where ns.nurse_id = n.id and ns.tenant_id is null;

    update public.nurse_schedules
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 9. Update appointments (set from patient's tenant)
    update public.appointments a
    set tenant_id = p.tenant_id
    from public.patients p
    where a.patient_id = p.id and a.tenant_id is null;

    update public.appointments
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 10. Update medical_records (set from appointment's tenant)
    update public.medical_records mr
    set tenant_id = a.tenant_id
    from public.appointments a
    where mr.appointment_id = a.id and mr.tenant_id is null;

    update public.medical_records
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 11. Update prescriptions (set from medical_record's tenant)
    update public.prescriptions p
    set tenant_id = mr.tenant_id
    from public.medical_records mr
    where p.medical_record_id = mr.id and p.tenant_id is null;

    update public.prescriptions
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 12. Update referrals (set from patient's tenant)
    update public.referrals r
    set tenant_id = p.tenant_id
    from public.patients p
    where r.patient_id = p.id and r.tenant_id is null;

    update public.referrals
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 13. Update activity_logs (set from actor's profile tenant)
    update public.activity_logs al
    set tenant_id = pr.tenant_id
    from public.profiles pr
    where al.actor_id = pr.id and al.tenant_id is null;

    update public.activity_logs
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 14. Update billing (set from patient's tenant)
    update public.billing b
    set tenant_id = p.tenant_id
    from public.patients p
    where b.patient_id = p.id and b.tenant_id is null;

    update public.billing
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

    -- 15. Update medical_record_files (set from medical_record's tenant)
    update medical_record_files mrf
    set tenant_id = mr.tenant_id
    from public.medical_records mr
    where mrf.medical_record_id = mr.id and mrf.tenant_id is null;

    update medical_record_files
    set tenant_id = v_default_tenant_id
    where tenant_id is null;

end $$;
