CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    display_name text,
    logo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all_tenant_settings"
    ON public.tenant_settings
    FOR ALL
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "tenant_settings_tenant_select"
    ON public.tenant_settings
    FOR SELECT
    USING (
        tenant_id = public.get_user_tenant_id()
        OR public.is_superadmin()
    );

GRANT ALL ON public.tenant_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.tenant_settings TO authenticated;
