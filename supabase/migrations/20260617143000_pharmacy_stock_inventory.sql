create table if not exists "public"."medicine_stocks" (
    "id" uuid not null default gen_random_uuid(),
    "medicine_name" text not null,
    "dosage" text not null default '',
    "supplier" text not null,
    "batch_number" text not null,
    "expired_date" date not null,
    "quantity" integer not null default 0,
    "minimum_stock" integer not null default 20,
    "unit" text not null default 'tablet',
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table "public"."medicine_stocks" enable row level security;

create unique index if not exists "medicine_stocks_medicine_dosage_batch_key"
    on "public"."medicine_stocks" using btree ("medicine_name", "dosage", "batch_number");

create unique index if not exists "medicine_stocks_pkey"
    on "public"."medicine_stocks" using btree ("id");

alter table "public"."medicine_stocks"
    add constraint "medicine_stocks_pkey" primary key using index "medicine_stocks_pkey";

create table if not exists "public"."medicine_stock_movements" (
    "id" uuid not null default gen_random_uuid(),
    "medicine_stock_id" uuid references public.medicine_stocks(id) on delete cascade,
    "movement_type" text not null,
    "medicine_name" text not null,
    "dosage" text not null default '',
    "quantity" integer not null,
    "reason_or_supplier" text not null,
    "reference" text not null,
    "note" text,
    "batch_number" text,
    "expired_date" date,
    "created_at" timestamp with time zone default now()
);

alter table "public"."medicine_stock_movements" enable row level security;

alter table "public"."medicine_stock_movements"
    add constraint "medicine_stock_movements_movement_type_check"
    check ((movement_type = any (array['Incoming'::text, 'Outgoing'::text])));

create index if not exists "medicine_stock_movements_created_at_idx"
    on "public"."medicine_stock_movements" using btree ("created_at" desc);

create index if not exists "medicine_stock_movements_stock_id_idx"
    on "public"."medicine_stock_movements" using btree ("medicine_stock_id");

create unique index if not exists "medicine_stock_movements_pkey"
    on "public"."medicine_stock_movements" using btree ("id");

alter table "public"."medicine_stock_movements"
    add constraint "medicine_stock_movements_pkey" primary key using index "medicine_stock_movements_pkey";

create or replace function public.touch_medicine_stocks_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_updated_at on public.medicine_stocks;
create trigger set_updated_at
before update on public.medicine_stocks
for each row execute function public.touch_medicine_stocks_updated_at();
