alter table if exists "public"."medicine_stock_movements"
    add column if not exists "created_by" uuid references auth.users(id) on delete set null;

create index if not exists "medicine_stock_movements_created_by_idx"
    on "public"."medicine_stock_movements" using btree ("created_by");
