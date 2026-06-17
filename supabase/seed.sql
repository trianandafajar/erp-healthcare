-- =========================
-- Seed Roles
-- =========================

INSERT INTO public.roles (name, label)
VALUES
  ('admin', 'Administrator'),
  ('doctor', 'Doctor'),
  ('specialist', 'Specialist'),
  ('pharmacy', 'Pharmacist'),
  ('receptionist', 'Receptionist'),
  ('staff', 'Staff'),
  ('patient', 'Patient')
ON CONFLICT (name) DO NOTHING;

-- =========================
-- Seed Permissions
-- =========================

INSERT INTO public.permissions (name, label, module)
VALUES
  -- User
  ('user.view', 'View Users', 'user'),
  ('user.create', 'Create User', 'user'),
  ('user.edit', 'Edit User', 'user'),
  ('user.delete', 'Delete User', 'user'),

  -- Role
  ('role.view', 'View Roles', 'role'),
  ('role.create', 'Create Role', 'role'),
  ('role.edit', 'Edit Role', 'role'),
  ('role.delete', 'Delete Role', 'role'),
  ('permission.assign', 'Assign Permission', 'role'),

  -- Doctor
  ('doctor.view', 'View Doctor', 'doctor'),
  ('doctor.create', 'Create Doctor', 'doctor'),
  ('doctor.edit', 'Edit Doctor', 'doctor'),
  ('doctor.delete', 'Delete Doctor', 'doctor'),

  -- Patient
  ('patient.view', 'View Patient', 'patient'),
  ('patient.create', 'Create Patient', 'patient'),
  ('patient.edit', 'Edit Patient', 'patient'),
  ('patient.delete', 'Delete Patient', 'patient'),

  -- Department
  ('department.view', 'View Department', 'department'),
  ('department.create', 'Create Department', 'department'),
  ('department.edit', 'Edit Department', 'department'),
  ('department.delete', 'Delete Department', 'department'),

  -- Report
  ('report.view', 'View Report', 'report'),
  ('report.export', 'Export Report', 'report')

ON CONFLICT (name) DO NOTHING;

-- =========================
-- Seed Role Permissions
-- =========================

DO $$
DECLARE
    v_role_id uuid;
    v_perm_id uuid;
    perm_name text;
    perm_names text[];
BEGIN

    -- =====================
    -- ADMIN (all permissions)
    -- =====================

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'admin';

    FOR v_perm_id IN
        SELECT id FROM public.permissions
    LOOP
        INSERT INTO public.role_permissions(role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- =====================
    -- DOCTOR
    -- =====================

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'doctor';

    perm_names := ARRAY[
        'patient.view',
        'patient.edit',
        'report.view'
    ];

    FOREACH perm_name IN ARRAY perm_names LOOP
        SELECT id INTO v_perm_id
        FROM public.permissions
        WHERE name = perm_name;

        INSERT INTO public.role_permissions(role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- =====================
    -- SPECIALIST
    -- =====================

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'specialist';

    perm_names := ARRAY[
        'patient.view',
        'patient.edit',
        'report.view'
    ];

    FOREACH perm_name IN ARRAY perm_names LOOP
        SELECT id INTO v_perm_id
        FROM public.permissions
        WHERE name = perm_name;

        INSERT INTO public.role_permissions(role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- =====================
    -- PHARMACY
    -- =====================

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'pharmacy';

    perm_names := ARRAY[
        'patient.view'
    ];

    FOREACH perm_name IN ARRAY perm_names LOOP
        SELECT id INTO v_perm_id
        FROM public.permissions
        WHERE name = perm_name;

        INSERT INTO public.role_permissions(role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'receptionist';

    perm_names := ARRAY[
        'patient.view',
        'patient.create',
        'patient.edit',
        'doctor.view',
        'department.view'
    ];

    FOREACH perm_name IN ARRAY perm_names LOOP
        SELECT id INTO v_perm_id
        FROM public.permissions
        WHERE name = perm_name;

        INSERT INTO public.role_permissions(role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- =====================
    -- STAFF
    -- =====================

    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'staff';

    perm_names := ARRAY[
        'user.view',
        'doctor.view',
        'patient.view',
        'department.view',
        'report.view'
    ];

    FOREACH perm_name IN ARRAY perm_names LOOP
        SELECT id INTO v_perm_id
        FROM public.permissions
        WHERE name = perm_name;

        INSERT INTO public.role_permissions(role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

END $$;
