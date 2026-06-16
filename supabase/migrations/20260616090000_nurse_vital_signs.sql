create table "public"."nurse_vital_signs" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "recorded_by" uuid,
    "blood_pressure" text not null,
    "temperature" numeric(4,1),
    "weight" numeric(5,2),
    "height" numeric(5,2),
    "pulse" integer,
    "notes" text,
    "recorded_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."nurse_vital_signs" enable row level security;

alter table "public"."nurse_vital_signs"
    add constraint "nurse_vital_signs_pkey" primary key ("id");

alter table "public"."nurse_vital_signs"
    add constraint "nurse_vital_signs_patient_id_fkey"
    foreign key ("patient_id")
    references "public"."patients" ("id")
    on delete cascade;

alter table "public"."nurse_vital_signs"
    add constraint "nurse_vital_signs_recorded_by_fkey"
    foreign key ("recorded_by")
    references "public"."profiles" ("id")
    on delete set null;

create index "nurse_vital_signs_patient_id_idx" on "public"."nurse_vital_signs" using btree ("patient_id");
create index "nurse_vital_signs_recorded_at_idx" on "public"."nurse_vital_signs" using btree ("recorded_at" desc);

create trigger "set_updated_at"
before update on "public"."nurse_vital_signs"
for each row execute function "public"."update_updated_at"();

grant select, insert, update, delete, references on table "public"."nurse_vital_signs" to "authenticated";
grant select, insert, update, delete, references on table "public"."nurse_vital_signs" to "service_role";

create policy "nurse_vital_signs_select_nurse"
on "public"."nurse_vital_signs"
for select
to authenticated
using (
    exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name = 'nurse'
    )
);

create policy "nurse_vital_signs_insert_nurse"
on "public"."nurse_vital_signs"
for insert
to authenticated
with check (
    exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.name = 'nurse'
    )
);
