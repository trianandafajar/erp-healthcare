ALTER TABLE profiles ADD COLUMN email_verified boolean DEFAULT false;

CREATE TABLE email_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    otp text NOT NULL,
    attempts int DEFAULT 0,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Set verified=true untuk semua superadmin yang sudah ada
UPDATE profiles
SET email_verified = true
WHERE id IN (
    SELECT ur.user_id
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'superadmin'
);

-- Handle_new_user: superadmin auto-verified
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path TO 'public'
AS $function$
DECLARE
    v_full_name text;
    v_role_name text;
    v_role_id uuid;
    v_tenant_name text;
    v_tenant_slug text;
    v_tenant_id uuid;
BEGIN
    v_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.email
    );

    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, v_full_name)
    ON CONFLICT (id) DO NOTHING;

    v_tenant_name := new.raw_user_meta_data->>'tenant_name';
    v_tenant_slug := new.raw_user_meta_data->>'tenant_slug';

    IF v_tenant_name IS NOT NULL AND v_tenant_slug IS NOT NULL THEN
        INSERT INTO public.tenants (name, slug, owner_id)
        VALUES (v_tenant_name, v_tenant_slug, new.id)
        RETURNING id INTO v_tenant_id;

        UPDATE public.profiles
        SET tenant_id = v_tenant_id
        WHERE id = new.id;
    END IF;

    v_role_name := COALESCE(new.raw_user_meta_data->>'role', 'patient');

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = v_role_name;

    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM public.roles WHERE name = 'patient';
    END IF;

    IF v_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new.id, v_role_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Superadmin auto-verified, other roles need email OTP
    IF v_role_name = 'superadmin' THEN
        UPDATE public.profiles SET email_verified = true WHERE id = new.id;
    END IF;

    IF v_role_name = 'patient' THEN
        INSERT INTO public.patients (profile_id, full_name, tenant_id)
        VALUES (new.id, v_full_name, v_tenant_id)
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    IF v_role_name = 'doctor' THEN
        INSERT INTO public.doctors (id, tenant_id)
        VALUES (new.id, v_tenant_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN new;
END;
$function$;
