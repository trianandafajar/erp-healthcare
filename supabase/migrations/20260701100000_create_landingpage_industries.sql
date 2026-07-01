create table
    "public"."landingpage_industries" (
        "id" uuid not null default gen_random_uuid (),
        "title" text not null,
        "description" text not null,
        "image_url" text not null,
        "sort_order" integer not null default 0,
        "is_active" boolean not null default true,
        "created_at" timestamp
        with
            time zone default now (),
            "updated_at" timestamp
        with
            time zone default now ()
    );

alter table "public"."landingpage_industries" enable row level security;

alter table public.landingpage_industries add constraint landingpage_industries_pkey primary key (id);

GRANT ALL ON TABLE public.landingpage_industries TO service_role;

GRANT ALL ON TABLE public.landingpage_industries TO postgres;