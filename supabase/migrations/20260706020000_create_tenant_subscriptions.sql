CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan            text NOT NULL DEFAULT 'free',
    status          text NOT NULL DEFAULT 'active',
    billing_cycle   text DEFAULT 'monthly',
    amount          numeric(10,2) NOT NULL DEFAULT 0,
    currency        text NOT NULL DEFAULT 'USD',
    start_date      timestamptz NOT NULL DEFAULT now(),
    next_billing    timestamptz,
    trial_ends      timestamptz,
    payment_method  text,
    -- stripe columns (future)
    stripe_customer_id      text,
    stripe_subscription_id  text,
    stripe_price_id         text,
    -- meta
    created_by      uuid REFERENCES auth.users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz
);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all_tenant_subscriptions"
    ON public.tenant_subscriptions
    FOR ALL
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

-- backfill existing tenants into tenant_subscriptions
INSERT INTO public.tenant_subscriptions (tenant_id, plan, status, billing_cycle, amount, start_date)
SELECT
    id,
    COALESCE(subscription_plan, 'free'),
    COALESCE(subscription_status, 'active'),
    CASE
        WHEN COALESCE(subscription_plan, 'free') = 'free' THEN NULL
        ELSE 'monthly'
    END,
    CASE
        WHEN COALESCE(subscription_plan, 'free') = 'free' THEN 0
        WHEN subscription_plan = 'basic' THEN 49
        WHEN subscription_plan = 'pro' THEN 99
        WHEN subscription_plan = 'enterprise' THEN 199
        ELSE 0
    END,
    created_at
FROM public.tenants
WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_subscriptions WHERE tenant_subscriptions.tenant_id = tenants.id
);


grant select, insert, update, delete, references on table public.tenant_subscriptions to authenticated;
grant select, insert, update, delete, references on table public.tenant_subscriptions to service_role;
grant select, insert, update, delete, references on table public.tenant_subscriptions to anon;