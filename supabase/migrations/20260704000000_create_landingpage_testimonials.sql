create table if not exists public.landingpage_testimonials (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    role text not null,
    institution text not null,
    quote text not null,
    rating int not null default 5,
    image_url text not null,
    sort_order int not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.landingpage_testimonials enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on public.landingpage_testimonials to service_role;
grant select on public.landingpage_testimonials to anon, authenticated;

create policy "Superadmin full access on landingpage_testimonials"
    on public.landingpage_testimonials for all
    using (public.is_superadmin())
    with check (public.is_superadmin());

create policy "Public can view active testimonials"
    on public.landingpage_testimonials for select
    using (is_active = true);

insert into public.landingpage_testimonials (name, role, institution, quote, rating, image_url, sort_order) values
    ('Dr. Andi Pratama', 'Director', 'RS Pusat Jakarta', 'This platform has completely transformed how we manage patient records. The integration between registration, pharmacy, and billing saved us hours of manual work every day.', 5, '/landingpage/testimonials/andri.png', 1),
    ('Siti Nurhaliza', 'Head of Operations', 'Klinik Sehat Keluarga', 'The real-time dashboard and reporting features give us unprecedented visibility into our operations. We can now make data-driven decisions that improve patient care.', 5, '/landingpage/testimonials/siti.png', 2),
    ('Apt. Rahmatullah', 'Pharmacy Manager', 'Apotek Medika Farma', 'Implementing this ERP was the best decision we made. The pharmacy module alone reduced medication errors by 80% and streamlined our entire supply chain.', 4, '/landingpage/testimonials/rahmatullah.png', 3);
