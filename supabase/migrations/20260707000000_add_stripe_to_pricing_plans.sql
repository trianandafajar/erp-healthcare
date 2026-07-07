alter table public.pricing_plans
    add column if not exists stripe_product_id text,
    add column if not exists stripe_price_id text,
    add column if not exists stripe_price_id_yearly text;
