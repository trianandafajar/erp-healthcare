DO $$
DECLARE
    v_role_id uuid;
    v_perm_id uuid;
BEGIN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'superadmin';
    SELECT id INTO v_perm_id FROM public.permissions WHERE name = 'user.impersonate';

    IF v_role_id IS NOT NULL AND v_perm_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
