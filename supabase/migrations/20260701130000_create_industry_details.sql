gcreate table "public"."industry_details" (
    "id" uuid not null default gen_random_uuid(),
    "industry_id" uuid not null references public.landingpage_industries(id) on delete cascade,
    "content" jsonb not null default '{}',
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

create unique index if not exists idx_industry_details_industry on public.industry_details(industry_id);

alter table "public"."industry_details" enable row level security;

alter table public.landingpage_industries drop column if exists content;

GRANT ALL ON TABLE public.industry_details TO service_role;

GRANT ALL ON TABLE public.industry_details TO postgres;