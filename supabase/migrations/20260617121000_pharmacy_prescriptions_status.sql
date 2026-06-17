alter table "public"."prescriptions"
add column if not exists "status" text not null default 'Pending',
add column if not exists "pharmacist_note" text,
add column if not exists "rejection_note" text,
add column if not exists "verified_at" timestamp with time zone,
add column if not exists "dispensed_at" timestamp with time zone,
add column if not exists "updated_at" timestamp with time zone default now();

create index if not exists "prescriptions_status_idx"
    on "public"."prescriptions" using btree ("status");

alter publication "supabase_realtime" add table "public"."prescriptions";

create policy if not exists "pharmacy_prescriptions_select_pharmacy"
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

create policy if not exists "pharmacy_prescriptions_update_pharmacy"
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
