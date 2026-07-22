alter table public.medical_records
    drop constraint if exists medical_records_patient_id_fkey,
    add constraint medical_records_patient_id_fkey
        foreign key (patient_id) references public.patients(id) on delete cascade;

alter table public.prescriptions
    drop constraint if exists prescriptions_patient_id_fkey,
    add constraint prescriptions_patient_id_fkey
        foreign key (patient_id) references public.patients(id) on delete cascade;

alter table public.referrals
    drop constraint if exists referrals_patient_id_fkey,
    add constraint referrals_patient_id_fkey
        foreign key (patient_id) references public.patients(id) on delete cascade;

alter table public.billing
    drop constraint if exists billing_patient_id_fkey,
    add constraint billing_patient_id_fkey
        foreign key (patient_id) references public.patients(id) on delete cascade;
