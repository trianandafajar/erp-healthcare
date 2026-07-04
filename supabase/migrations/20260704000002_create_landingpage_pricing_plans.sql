create table if not exists public.pricing_plans (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    subtitle text default '',
    price decimal(10,2) not null,
    yearly_price decimal(10,2),
    currency text not null default 'USD',
    features jsonb not null default '[]'::jsonb,
    button_label text not null default 'Get Started',
    button_link text not null default '/contact',
    is_recommended boolean not null default false,
    badge_text text default '',
    is_active boolean not null default true,
    sort_order int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on public.pricing_plans to service_role;
grant select on public.pricing_plans to anon, authenticated;

create policy "Superadmin full access on pricing_plans"
    on public.pricing_plans for all
    using (public.is_superadmin())
    with check (public.is_superadmin());

create policy "Public can view active pricing plans"
    on public.pricing_plans for select
    using (is_active = true);

insert into public.pricing_plans (title, subtitle, price, yearly_price, features, button_label, button_link, is_recommended, badge_text, sort_order) values
    ('Starter', 'Best for small clinics getting started', 29, 299, '["Up to 5 users", "Basic patient registration", "Medical records management", "Email support"]', 'Start Free Trial', '/register', false, '', 1),
    ('Basic', 'Perfect for growing practices', 59, 599, '["Up to 15 users", "Everything in Starter", "Pharmacy integration", "Appointment scheduling", "Billing & invoicing", "Priority email support"]', 'Get Started', '/register', false, '', 2),
    ('Professional', 'For established healthcare providers', 99, 999, '["Unlimited users", "Everything in Basic", "Advanced analytics dashboard", "Multi-branch management", "Lab integration", "API access", "Phone & chat support"]', 'Get Started', '/register', true, 'Most Popular', 3),
    ('Enterprise', 'For large hospital networks', 199, 1999, '["Unlimited everything", "All Professional features", "Custom integrations", "Dedicated account manager", "On-premise option", "24/7 priority support", "SLA guarantee"]', 'Contact Sales', '/contact', false, '', 4);
