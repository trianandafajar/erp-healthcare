alter table public.landingpage_industries
    add column if not exists slug text;

create unique index if not exists idx_landingpage_industries_slug on public.landingpage_industries(slug);
