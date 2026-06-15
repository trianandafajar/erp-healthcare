drop extension if exists "pg_net";

create type "public"."user_status" as enum ('active', 'inactive');


  create table "public"."activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "actor_id" uuid,
    "action" text not null,
    "module" text not null,
    "entity_id" text,
    "description" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."activity_logs" enable row level security;


  create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "doctor_id" uuid not null,
    "appointment_date" date not null,
    "appointment_time" time without time zone,
    "type" text not null default 'appointment'::text,
    "status" text not null default 'waiting'::text,
    "chief_complaint" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."appointments" enable row level security;


  create table "public"."departments" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "code" text,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."departments" enable row level security;


  create table "public"."doctor_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "doctor_id" uuid not null,
    "day_of_week" smallint not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "max_patients" integer default 20,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."doctor_schedules" enable row level security;


  create table "public"."doctors" (
    "id" uuid not null,
    "department_id" uuid,
    "specialization" text,
    "str_number" text,
    "sip_number" text,
    "phone" text,
    "photo_url" text,
    "biography" text,
    "experience_years" integer default 0,
    "consultation_fee" numeric(12,2) default 0,
    "is_available" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."doctors" enable row level security;


  create table "public"."medical_records" (
    "id" uuid not null default gen_random_uuid(),
    "appointment_id" uuid not null,
    "patient_id" uuid not null,
    "doctor_id" uuid not null,
    "blood_pressure" text,
    "heart_rate" integer,
    "temperature" numeric(4,1),
    "weight" numeric(5,2),
    "height" numeric(5,2),
    "subjective" text,
    "objective" text,
    "diagnosis" text,
    "icd10_code" text,
    "treatment_plan" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."medical_records" enable row level security;


  create table "public"."mrn_counters" (
    "year" integer not null,
    "last_number" integer not null default 0
      );


alter table "public"."mrn_counters" enable row level security;


  create table "public"."nurse_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "nurse_id" uuid not null,
    "day_of_week" smallint not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "max_patients" integer default 20,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."nurse_schedules" enable row level security;


  create table "public"."nurses" (
    "id" uuid not null,
    "department_id" uuid,
    "phone" text,
    "photo_url" text,
    "experience_years" integer default 0,
    "is_available" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."nurses" enable row level security;


  create table "public"."patients" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid,
    "full_name" text not null,
    "date_of_birth" date,
    "gender" text,
    "phone" text,
    "address" text,
    "blood_type" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "medical_record_number" text
      );


alter table "public"."patients" enable row level security;


  create table "public"."permissions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "label" text not null,
    "module" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."permissions" enable row level security;


  create table "public"."prescriptions" (
    "id" uuid not null default gen_random_uuid(),
    "medical_record_id" uuid not null,
    "patient_id" uuid not null,
    "doctor_id" uuid not null,
    "medication_name" text not null,
    "dosage" text,
    "frequency" text,
    "duration" text,
    "instructions" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."prescriptions" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text,
    "created_at" timestamp with time zone default now(),
    "status" public.user_status not null default 'active'::public.user_status,
    "email" text,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."referrals" (
    "id" uuid not null default gen_random_uuid(),
    "medical_record_id" uuid not null,
    "patient_id" uuid not null,
    "from_doctor_id" uuid not null,
    "to_department_id" uuid,
    "reason" text,
    "notes" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."referrals" enable row level security;


  create table "public"."role_permissions" (
    "role_id" uuid not null,
    "permission_id" uuid not null
      );


alter table "public"."role_permissions" enable row level security;


  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "label" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."roles" enable row level security;


  create table "public"."user_roles" (
    "user_id" uuid not null,
    "role_id" uuid not null
      );


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX departments_code_key ON public.departments USING btree (code);

CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name);

CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id);

CREATE UNIQUE INDEX doctor_schedules_pkey ON public.doctor_schedules USING btree (id);

CREATE UNIQUE INDEX doctors_pkey ON public.doctors USING btree (id);

CREATE UNIQUE INDEX doctors_str_number_key ON public.doctors USING btree (str_number);

CREATE INDEX idx_activity_logs_actor ON public.activity_logs USING btree (actor_id);

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at DESC);

CREATE INDEX idx_appointments_doctor_date ON public.appointments USING btree (doctor_id, appointment_date);

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);

CREATE INDEX idx_doctor_schedules_doctor ON public.doctor_schedules USING btree (doctor_id);

CREATE INDEX idx_nurse_schedules_nurse ON public.nurse_schedules USING btree (nurse_id);

CREATE INDEX idx_patients_profile ON public.patients USING btree (profile_id);

CREATE UNIQUE INDEX medical_records_pkey ON public.medical_records USING btree (id);

CREATE UNIQUE INDEX mrn_counters_pkey ON public.mrn_counters USING btree (year);

CREATE UNIQUE INDEX nurse_schedules_pkey ON public.nurse_schedules USING btree (id);

CREATE UNIQUE INDEX nurses_pkey ON public.nurses USING btree (id);

CREATE UNIQUE INDEX patients_medical_record_number_key ON public.patients USING btree (medical_record_number);

CREATE UNIQUE INDEX patients_pkey ON public.patients USING btree (id);

CREATE UNIQUE INDEX patients_profile_id_key ON public.patients USING btree (profile_id);

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);

CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);

CREATE UNIQUE INDEX prescriptions_pkey ON public.prescriptions USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX referrals_pkey ON public.referrals USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role_id, permission_id);

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role_id);

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."departments" add constraint "departments_pkey" PRIMARY KEY using index "departments_pkey";

alter table "public"."doctor_schedules" add constraint "doctor_schedules_pkey" PRIMARY KEY using index "doctor_schedules_pkey";

alter table "public"."doctors" add constraint "doctors_pkey" PRIMARY KEY using index "doctors_pkey";

alter table "public"."medical_records" add constraint "medical_records_pkey" PRIMARY KEY using index "medical_records_pkey";

alter table "public"."mrn_counters" add constraint "mrn_counters_pkey" PRIMARY KEY using index "mrn_counters_pkey";

alter table "public"."nurse_schedules" add constraint "nurse_schedules_pkey" PRIMARY KEY using index "nurse_schedules_pkey";

alter table "public"."nurses" add constraint "nurses_pkey" PRIMARY KEY using index "nurses_pkey";

alter table "public"."patients" add constraint "patients_pkey" PRIMARY KEY using index "patients_pkey";

alter table "public"."permissions" add constraint "permissions_pkey" PRIMARY KEY using index "permissions_pkey";

alter table "public"."prescriptions" add constraint "prescriptions_pkey" PRIMARY KEY using index "prescriptions_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."referrals" add constraint "referrals_pkey" PRIMARY KEY using index "referrals_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."activity_logs" add constraint "activity_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_actor_id_fkey";

alter table "public"."appointments" add constraint "appointments_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_doctor_id_fkey";

alter table "public"."appointments" add constraint "appointments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_patient_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK ((status = ANY (ARRAY['waiting'::text, 'in_progress'::text, 'done'::text, 'cancelled'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."appointments" add constraint "appointments_type_check" CHECK ((type = ANY (ARRAY['appointment'::text, 'walkin'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_type_check";

alter table "public"."departments" add constraint "departments_code_key" UNIQUE using index "departments_code_key";

alter table "public"."departments" add constraint "departments_name_key" UNIQUE using index "departments_name_key";

alter table "public"."doctor_schedules" add constraint "doctor_schedules_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."doctor_schedules" validate constraint "doctor_schedules_day_of_week_check";

alter table "public"."doctor_schedules" add constraint "doctor_schedules_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE not valid;

alter table "public"."doctor_schedules" validate constraint "doctor_schedules_doctor_id_fkey";

alter table "public"."doctor_schedules" add constraint "valid_time_range" CHECK ((end_time > start_time)) not valid;

alter table "public"."doctor_schedules" validate constraint "valid_time_range";

alter table "public"."doctors" add constraint "doctors_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL not valid;

alter table "public"."doctors" validate constraint "doctors_department_id_fkey";

alter table "public"."doctors" add constraint "doctors_id_fkey" FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."doctors" validate constraint "doctors_id_fkey";

alter table "public"."doctors" add constraint "doctors_str_number_key" UNIQUE using index "doctors_str_number_key";

alter table "public"."medical_records" add constraint "medical_records_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE not valid;

alter table "public"."medical_records" validate constraint "medical_records_appointment_id_fkey";

alter table "public"."medical_records" add constraint "medical_records_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) not valid;

alter table "public"."medical_records" validate constraint "medical_records_doctor_id_fkey";

alter table "public"."medical_records" add constraint "medical_records_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."medical_records" validate constraint "medical_records_patient_id_fkey";

alter table "public"."nurse_schedules" add constraint "nurse_schedules_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."nurse_schedules" validate constraint "nurse_schedules_day_of_week_check";

alter table "public"."nurse_schedules" add constraint "nurse_schedules_nurse_id_fkey" FOREIGN KEY (nurse_id) REFERENCES public.nurses(id) ON DELETE CASCADE not valid;

alter table "public"."nurse_schedules" validate constraint "nurse_schedules_nurse_id_fkey";

alter table "public"."nurse_schedules" add constraint "valid_time_range" CHECK ((end_time > start_time)) not valid;

alter table "public"."nurse_schedules" validate constraint "valid_time_range";

alter table "public"."nurses" add constraint "nurses_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL not valid;

alter table "public"."nurses" validate constraint "nurses_department_id_fkey";

alter table "public"."nurses" add constraint "nurses_id_fkey" FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."nurses" validate constraint "nurses_id_fkey";

alter table "public"."patients" add constraint "patients_blood_type_check" CHECK ((blood_type = ANY (ARRAY['A'::text, 'B'::text, 'AB'::text, 'O'::text]))) not valid;

alter table "public"."patients" validate constraint "patients_blood_type_check";

alter table "public"."patients" add constraint "patients_gender_check" CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text]))) not valid;

alter table "public"."patients" validate constraint "patients_gender_check";

alter table "public"."patients" add constraint "patients_medical_record_number_key" UNIQUE using index "patients_medical_record_number_key";

alter table "public"."patients" add constraint "patients_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."patients" validate constraint "patients_profile_id_fkey";

alter table "public"."patients" add constraint "patients_profile_id_key" UNIQUE using index "patients_profile_id_key";

alter table "public"."permissions" add constraint "permissions_name_key" UNIQUE using index "permissions_name_key";

alter table "public"."prescriptions" add constraint "prescriptions_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_doctor_id_fkey";

alter table "public"."prescriptions" add constraint "prescriptions_medical_record_id_fkey" FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(id) ON DELETE CASCADE not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_medical_record_id_fkey";

alter table "public"."prescriptions" add constraint "prescriptions_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_patient_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."referrals" add constraint "referrals_from_doctor_id_fkey" FOREIGN KEY (from_doctor_id) REFERENCES public.doctors(id) not valid;

alter table "public"."referrals" validate constraint "referrals_from_doctor_id_fkey";

alter table "public"."referrals" add constraint "referrals_medical_record_id_fkey" FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(id) not valid;

alter table "public"."referrals" validate constraint "referrals_medical_record_id_fkey";

alter table "public"."referrals" add constraint "referrals_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."referrals" validate constraint "referrals_patient_id_fkey";

alter table "public"."referrals" add constraint "referrals_to_department_id_fkey" FOREIGN KEY (to_department_id) REFERENCES public.departments(id) not valid;

alter table "public"."referrals" validate constraint "referrals_to_department_id_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_permission_id_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_role_id_fkey";

alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";

alter table "public"."user_roles" add constraint "user_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey_profiles" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey_profiles";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_mrn()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  current_year integer := extract(year from now());
  next_number integer;
  mrn text;
begin
  insert into public.mrn_counters (year, last_number)
  values (current_year, 1)
  on conflict (year) do update
    set last_number = mrn_counters.last_number + 1
  returning last_number into next_number;

  mrn := 'RM-' || current_year || '-' || lpad(next_number::text, 5, '0');

  return mrn;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_rm_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  next_seq int;
begin
  select count(*) + 1 into next_seq from patients
  where extract(year from created_at) = extract(year from now());
  
  new.medical_record_number := 'RM-' || extract(year from now()) || '-' || lpad(next_seq::text, 5, '0');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_permissions()
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select array_agg(distinct p.name)
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid();
$function$
;

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

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(permission_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.name = permission_name
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_activity(p_actor_id uuid, p_action text, p_module text, p_entity_id text, p_description text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.activity_logs (actor_id, action, module, entity_id, description, metadata)
  values (p_actor_id, p_action, p_module, p_entity_id, p_description, p_metadata);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_patient_mrn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.medical_record_number is null then
    new.medical_record_number := public.generate_mrn();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_email_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.email = (SELECT email FROM auth.users WHERE id = NEW.id);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant references on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant trigger on table "public"."activity_logs" to "anon";

grant truncate on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant references on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant trigger on table "public"."activity_logs" to "authenticated";

grant truncate on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant references on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant trigger on table "public"."activity_logs" to "service_role";

grant truncate on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."departments" to "anon";

grant insert on table "public"."departments" to "anon";

grant references on table "public"."departments" to "anon";

grant select on table "public"."departments" to "anon";

grant trigger on table "public"."departments" to "anon";

grant truncate on table "public"."departments" to "anon";

grant update on table "public"."departments" to "anon";

grant delete on table "public"."departments" to "authenticated";

grant insert on table "public"."departments" to "authenticated";

grant references on table "public"."departments" to "authenticated";

grant select on table "public"."departments" to "authenticated";

grant trigger on table "public"."departments" to "authenticated";

grant truncate on table "public"."departments" to "authenticated";

grant update on table "public"."departments" to "authenticated";

grant delete on table "public"."departments" to "service_role";

grant insert on table "public"."departments" to "service_role";

grant references on table "public"."departments" to "service_role";

grant select on table "public"."departments" to "service_role";

grant trigger on table "public"."departments" to "service_role";

grant truncate on table "public"."departments" to "service_role";

grant update on table "public"."departments" to "service_role";

grant delete on table "public"."doctor_schedules" to "anon";

grant insert on table "public"."doctor_schedules" to "anon";

grant references on table "public"."doctor_schedules" to "anon";

grant select on table "public"."doctor_schedules" to "anon";

grant trigger on table "public"."doctor_schedules" to "anon";

grant truncate on table "public"."doctor_schedules" to "anon";

grant update on table "public"."doctor_schedules" to "anon";

grant delete on table "public"."doctor_schedules" to "authenticated";

grant insert on table "public"."doctor_schedules" to "authenticated";

grant references on table "public"."doctor_schedules" to "authenticated";

grant select on table "public"."doctor_schedules" to "authenticated";

grant trigger on table "public"."doctor_schedules" to "authenticated";

grant truncate on table "public"."doctor_schedules" to "authenticated";

grant update on table "public"."doctor_schedules" to "authenticated";

grant delete on table "public"."doctor_schedules" to "service_role";

grant insert on table "public"."doctor_schedules" to "service_role";

grant references on table "public"."doctor_schedules" to "service_role";

grant select on table "public"."doctor_schedules" to "service_role";

grant trigger on table "public"."doctor_schedules" to "service_role";

grant truncate on table "public"."doctor_schedules" to "service_role";

grant update on table "public"."doctor_schedules" to "service_role";

grant delete on table "public"."doctors" to "anon";

grant insert on table "public"."doctors" to "anon";

grant references on table "public"."doctors" to "anon";

grant select on table "public"."doctors" to "anon";

grant trigger on table "public"."doctors" to "anon";

grant truncate on table "public"."doctors" to "anon";

grant update on table "public"."doctors" to "anon";

grant delete on table "public"."doctors" to "authenticated";

grant insert on table "public"."doctors" to "authenticated";

grant references on table "public"."doctors" to "authenticated";

grant select on table "public"."doctors" to "authenticated";

grant trigger on table "public"."doctors" to "authenticated";

grant truncate on table "public"."doctors" to "authenticated";

grant update on table "public"."doctors" to "authenticated";

grant delete on table "public"."doctors" to "service_role";

grant insert on table "public"."doctors" to "service_role";

grant references on table "public"."doctors" to "service_role";

grant select on table "public"."doctors" to "service_role";

grant trigger on table "public"."doctors" to "service_role";

grant truncate on table "public"."doctors" to "service_role";

grant update on table "public"."doctors" to "service_role";

grant delete on table "public"."medical_records" to "anon";

grant insert on table "public"."medical_records" to "anon";

grant references on table "public"."medical_records" to "anon";

grant select on table "public"."medical_records" to "anon";

grant trigger on table "public"."medical_records" to "anon";

grant truncate on table "public"."medical_records" to "anon";

grant update on table "public"."medical_records" to "anon";

grant delete on table "public"."medical_records" to "authenticated";

grant insert on table "public"."medical_records" to "authenticated";

grant references on table "public"."medical_records" to "authenticated";

grant select on table "public"."medical_records" to "authenticated";

grant trigger on table "public"."medical_records" to "authenticated";

grant truncate on table "public"."medical_records" to "authenticated";

grant update on table "public"."medical_records" to "authenticated";

grant delete on table "public"."medical_records" to "service_role";

grant insert on table "public"."medical_records" to "service_role";

grant references on table "public"."medical_records" to "service_role";

grant select on table "public"."medical_records" to "service_role";

grant trigger on table "public"."medical_records" to "service_role";

grant truncate on table "public"."medical_records" to "service_role";

grant update on table "public"."medical_records" to "service_role";

grant delete on table "public"."mrn_counters" to "anon";

grant insert on table "public"."mrn_counters" to "anon";

grant references on table "public"."mrn_counters" to "anon";

grant select on table "public"."mrn_counters" to "anon";

grant trigger on table "public"."mrn_counters" to "anon";

grant truncate on table "public"."mrn_counters" to "anon";

grant update on table "public"."mrn_counters" to "anon";

grant delete on table "public"."mrn_counters" to "authenticated";

grant insert on table "public"."mrn_counters" to "authenticated";

grant references on table "public"."mrn_counters" to "authenticated";

grant select on table "public"."mrn_counters" to "authenticated";

grant trigger on table "public"."mrn_counters" to "authenticated";

grant truncate on table "public"."mrn_counters" to "authenticated";

grant update on table "public"."mrn_counters" to "authenticated";

grant delete on table "public"."mrn_counters" to "service_role";

grant insert on table "public"."mrn_counters" to "service_role";

grant references on table "public"."mrn_counters" to "service_role";

grant select on table "public"."mrn_counters" to "service_role";

grant trigger on table "public"."mrn_counters" to "service_role";

grant truncate on table "public"."mrn_counters" to "service_role";

grant update on table "public"."mrn_counters" to "service_role";

grant delete on table "public"."nurse_schedules" to "anon";

grant insert on table "public"."nurse_schedules" to "anon";

grant references on table "public"."nurse_schedules" to "anon";

grant select on table "public"."nurse_schedules" to "anon";

grant trigger on table "public"."nurse_schedules" to "anon";

grant truncate on table "public"."nurse_schedules" to "anon";

grant update on table "public"."nurse_schedules" to "anon";

grant delete on table "public"."nurse_schedules" to "authenticated";

grant insert on table "public"."nurse_schedules" to "authenticated";

grant references on table "public"."nurse_schedules" to "authenticated";

grant select on table "public"."nurse_schedules" to "authenticated";

grant trigger on table "public"."nurse_schedules" to "authenticated";

grant truncate on table "public"."nurse_schedules" to "authenticated";

grant update on table "public"."nurse_schedules" to "authenticated";

grant delete on table "public"."nurse_schedules" to "service_role";

grant insert on table "public"."nurse_schedules" to "service_role";

grant references on table "public"."nurse_schedules" to "service_role";

grant select on table "public"."nurse_schedules" to "service_role";

grant trigger on table "public"."nurse_schedules" to "service_role";

grant truncate on table "public"."nurse_schedules" to "service_role";

grant update on table "public"."nurse_schedules" to "service_role";

grant delete on table "public"."nurses" to "anon";

grant insert on table "public"."nurses" to "anon";

grant references on table "public"."nurses" to "anon";

grant select on table "public"."nurses" to "anon";

grant trigger on table "public"."nurses" to "anon";

grant truncate on table "public"."nurses" to "anon";

grant update on table "public"."nurses" to "anon";

grant delete on table "public"."nurses" to "authenticated";

grant insert on table "public"."nurses" to "authenticated";

grant references on table "public"."nurses" to "authenticated";

grant select on table "public"."nurses" to "authenticated";

grant trigger on table "public"."nurses" to "authenticated";

grant truncate on table "public"."nurses" to "authenticated";

grant update on table "public"."nurses" to "authenticated";

grant delete on table "public"."nurses" to "service_role";

grant insert on table "public"."nurses" to "service_role";

grant references on table "public"."nurses" to "service_role";

grant select on table "public"."nurses" to "service_role";

grant trigger on table "public"."nurses" to "service_role";

grant truncate on table "public"."nurses" to "service_role";

grant update on table "public"."nurses" to "service_role";

grant delete on table "public"."patients" to "anon";

grant insert on table "public"."patients" to "anon";

grant references on table "public"."patients" to "anon";

grant select on table "public"."patients" to "anon";

grant trigger on table "public"."patients" to "anon";

grant truncate on table "public"."patients" to "anon";

grant update on table "public"."patients" to "anon";

grant delete on table "public"."patients" to "authenticated";

grant insert on table "public"."patients" to "authenticated";

grant references on table "public"."patients" to "authenticated";

grant select on table "public"."patients" to "authenticated";

grant trigger on table "public"."patients" to "authenticated";

grant truncate on table "public"."patients" to "authenticated";

grant update on table "public"."patients" to "authenticated";

grant delete on table "public"."patients" to "service_role";

grant insert on table "public"."patients" to "service_role";

grant references on table "public"."patients" to "service_role";

grant select on table "public"."patients" to "service_role";

grant trigger on table "public"."patients" to "service_role";

grant truncate on table "public"."patients" to "service_role";

grant update on table "public"."patients" to "service_role";

grant delete on table "public"."permissions" to "anon";

grant insert on table "public"."permissions" to "anon";

grant references on table "public"."permissions" to "anon";

grant select on table "public"."permissions" to "anon";

grant trigger on table "public"."permissions" to "anon";

grant truncate on table "public"."permissions" to "anon";

grant update on table "public"."permissions" to "anon";

grant delete on table "public"."permissions" to "authenticated";

grant insert on table "public"."permissions" to "authenticated";

grant references on table "public"."permissions" to "authenticated";

grant select on table "public"."permissions" to "authenticated";

grant trigger on table "public"."permissions" to "authenticated";

grant truncate on table "public"."permissions" to "authenticated";

grant update on table "public"."permissions" to "authenticated";

grant delete on table "public"."permissions" to "service_role";

grant insert on table "public"."permissions" to "service_role";

grant references on table "public"."permissions" to "service_role";

grant select on table "public"."permissions" to "service_role";

grant trigger on table "public"."permissions" to "service_role";

grant truncate on table "public"."permissions" to "service_role";

grant update on table "public"."permissions" to "service_role";

grant delete on table "public"."prescriptions" to "anon";

grant insert on table "public"."prescriptions" to "anon";

grant references on table "public"."prescriptions" to "anon";

grant select on table "public"."prescriptions" to "anon";

grant trigger on table "public"."prescriptions" to "anon";

grant truncate on table "public"."prescriptions" to "anon";

grant update on table "public"."prescriptions" to "anon";

grant delete on table "public"."prescriptions" to "authenticated";

grant insert on table "public"."prescriptions" to "authenticated";

grant references on table "public"."prescriptions" to "authenticated";

grant select on table "public"."prescriptions" to "authenticated";

grant trigger on table "public"."prescriptions" to "authenticated";

grant truncate on table "public"."prescriptions" to "authenticated";

grant update on table "public"."prescriptions" to "authenticated";

grant delete on table "public"."prescriptions" to "service_role";

grant insert on table "public"."prescriptions" to "service_role";

grant references on table "public"."prescriptions" to "service_role";

grant select on table "public"."prescriptions" to "service_role";

grant trigger on table "public"."prescriptions" to "service_role";

grant truncate on table "public"."prescriptions" to "service_role";

grant update on table "public"."prescriptions" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."referrals" to "anon";

grant insert on table "public"."referrals" to "anon";

grant references on table "public"."referrals" to "anon";

grant select on table "public"."referrals" to "anon";

grant trigger on table "public"."referrals" to "anon";

grant truncate on table "public"."referrals" to "anon";

grant update on table "public"."referrals" to "anon";

grant delete on table "public"."referrals" to "authenticated";

grant insert on table "public"."referrals" to "authenticated";

grant references on table "public"."referrals" to "authenticated";

grant select on table "public"."referrals" to "authenticated";

grant trigger on table "public"."referrals" to "authenticated";

grant truncate on table "public"."referrals" to "authenticated";

grant update on table "public"."referrals" to "authenticated";

grant delete on table "public"."referrals" to "service_role";

grant insert on table "public"."referrals" to "service_role";

grant references on table "public"."referrals" to "service_role";

grant select on table "public"."referrals" to "service_role";

grant trigger on table "public"."referrals" to "service_role";

grant truncate on table "public"."referrals" to "service_role";

grant update on table "public"."referrals" to "service_role";

grant delete on table "public"."role_permissions" to "anon";

grant insert on table "public"."role_permissions" to "anon";

grant references on table "public"."role_permissions" to "anon";

grant select on table "public"."role_permissions" to "anon";

grant trigger on table "public"."role_permissions" to "anon";

grant truncate on table "public"."role_permissions" to "anon";

grant update on table "public"."role_permissions" to "anon";

grant delete on table "public"."role_permissions" to "authenticated";

grant insert on table "public"."role_permissions" to "authenticated";

grant references on table "public"."role_permissions" to "authenticated";

grant select on table "public"."role_permissions" to "authenticated";

grant trigger on table "public"."role_permissions" to "authenticated";

grant truncate on table "public"."role_permissions" to "authenticated";

grant update on table "public"."role_permissions" to "authenticated";

grant delete on table "public"."role_permissions" to "service_role";

grant insert on table "public"."role_permissions" to "service_role";

grant references on table "public"."role_permissions" to "service_role";

grant select on table "public"."role_permissions" to "service_role";

grant trigger on table "public"."role_permissions" to "service_role";

grant truncate on table "public"."role_permissions" to "service_role";

grant update on table "public"."role_permissions" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";


  create policy "activity_logs_no_direct_access"
  on "public"."activity_logs"
  as permissive
  for all
  to public
using (false);



  create policy "departments_select_all"
  on "public"."departments"
  as permissive
  for select
  to public
using (true);



  create policy "schedules_select_all"
  on "public"."doctor_schedules"
  as permissive
  for select
  to public
using (true);



  create policy "doctors_select_all"
  on "public"."doctors"
  as permissive
  for select
  to public
using (true);



  create policy "nurse_schedules_select_all"
  on "public"."nurse_schedules"
  as permissive
  for select
  to public
using (true);



  create policy "nurses_select_all"
  on "public"."nurses"
  as permissive
  for select
  to public
using (true);



  create policy "patients_select_own"
  on "public"."patients"
  as permissive
  for select
  to public
using ((profile_id = auth.uid()));



  create policy "Admin can read all profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) AND (id <> auth.uid())));



  create policy "users_own_profile"
  on "public"."profiles"
  as permissive
  for all
  to public
using ((auth.uid() = id));



  create policy "roles are viewable by authenticated users"
  on "public"."roles"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "users can view own roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.nurses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_set_patient_mrn BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_patient_mrn();

CREATE TRIGGER set_email_from_auth BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_email_from_auth();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


