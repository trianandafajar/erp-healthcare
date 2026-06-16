create table "public"."nurse_care_notes" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid not null,
    "recorded_by" uuid,
    "category" text not null default 'Observation',
    "note" text not null,
    "author_name" text not null default 'Nurse',
    "recorded_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."nurse_care_notes" enable row level security;

alter table "public"."nurse_care_notes"
    add constraint "nurse_care_notes_pkey" primary key ("id");

alter table "public"."nurse_care_notes"
    add constraint "nurse_care_notes_patient_id_fkey"
    foreign key ("patient_id")
    references "public"."patients" ("id")
    on delete cascade;

alter table "public"."nurse_care_notes"
    add constraint "nurse_care_notes_recorded_by_fkey"
    foreign key ("recorded_by")
    references "public"."profiles" ("id")
    on delete set null;

create index "nurse_care_notes_patient_id_idx" on "public"."nurse_care_notes" using btree ("patient_id");
create index "nurse_care_notes_recorded_at_idx" on "public"."nurse_care_notes" using btree ("recorded_at" desc);

create trigger "set_updated_at"
before update on "public"."nurse_care_notes"
for each row execute function "public"."update_updated_at"();

grant select, insert, update, delete, references on table "public"."nurse_care_notes" to "authenticated";
grant select, insert, update, delete, references on table "public"."nurse_care_notes" to "service_role";

create policy "nurse_care_notes_select_nurse"
on "public"."nurse_care_notes"
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

create policy "nurse_care_notes_insert_nurse"
on "public"."nurse_care_notes"
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
