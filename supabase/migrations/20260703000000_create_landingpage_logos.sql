create table if not exists public.landingpage_logos (
    id uuid primary key default gen_random_uuid(),
    title text not null default 'Logo',
    image_url text not null,
    sort_order int not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.landingpage_logos enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on public.landingpage_logos to service_role;
grant select on public.landingpage_logos to anon, authenticated;

create policy "Superadmin full access on landingpage_logos"
    on public.landingpage_logos for all
    using (public.is_superadmin())
    with check (public.is_superadmin());

create policy "Public can view active logos"
    on public.landingpage_logos for select
    using (is_active = true);

insert into public.landingpage_logos (title, image_url, sort_order) values
    ('Calendly', '/landingpage/sponsors/calenly.png', 1),
    ('Contena', '/landingpage/sponsors/contena.png', 2),
    ('Mentora', '/landingpage/sponsors/mentora.png', 3),
    ('Schedullin', '/landingpage/sponsors/schedullin.png', 4),
    ('Stockita', '/landingpage/sponsors/stockita.png', 5),
    ('Invoice', '/landingpage/sponsors/invoice.png', 6);
