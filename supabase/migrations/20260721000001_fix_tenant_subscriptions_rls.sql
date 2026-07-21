-- =========================
-- Fix tenant_subscriptions RLS
-- Allow tenant members to read their own subscription
-- (only superadmin had access before, which broke /api/profile for regular admins)
-- =========================

CREATE POLICY "tenant_subscriptions_tenant_select"
    ON public.tenant_subscriptions
    FOR SELECT
    USING (
        tenant_id = public.get_user_tenant_id()
        OR public.is_superadmin()
    );

