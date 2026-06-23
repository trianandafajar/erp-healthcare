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

    -- ensure category exists (migrations might have run already)
    ALTER TABLE public.permissions
    ADD COLUMN IF NOT EXISTS category text;

    -- seed permissions with category
    INSERT INTO public.permissions (name, label, module, category)
    VALUES
    -- General
    ('general.access', 'General Access', 'general', 'admin'),

    -- User
    ('user.view', 'View Users', 'user', 'admin'),
    ('user.create', 'Create User', 'user', 'admin'),
    ('user.edit', 'Edit User', 'user', 'admin'),
    ('user.delete', 'Delete User', 'user', 'admin'),

    -- Role
    ('role.view', 'View Roles', 'role', 'admin'),
    ('role.create', 'Create Role', 'role', 'admin'),
    ('role.edit', 'Edit Role', 'role', 'admin'),
    ('role.delete', 'Delete Role', 'role', 'admin'),
    ('permission.view', 'View Permissions', 'permission', 'admin'),
    ('permission.create', 'Create Permission', 'permission', 'admin'),
    ('permission.edit', 'Edit Permission', 'permission', 'admin'),
    ('permission.delete', 'Delete Permission', 'permission', 'admin'),
    ('permission.assign', 'Assign Permission', 'role', 'admin'),

    -- Doctor
    ('doctor.view', 'View Doctor', 'doctor', 'doctor'),
    ('doctor.create', 'Create Doctor', 'doctor', 'doctor'),
    ('doctor.edit', 'Edit Doctor', 'doctor', 'doctor'),
    ('doctor.delete', 'Delete Doctor', 'doctor', 'doctor'),

    -- Doctor area permissions (from pages)
    ('examination.view', 'View Examinations', 'examination', 'doctor'),
    ('medical.view', 'View Medical Records', 'medical', 'doctor'),
    ('patient-history.view', 'View Patient History', 'patient-history', 'doctor'),
    ('appointment.view', 'View Appointments', 'appointment', 'doctor'),
    ('referrals.view', 'View Referrals', 'referrals', 'doctor'),
    ('referrals.create', 'Create Referrals', 'referrals', 'doctor'),
    ('schedule.view', 'View Schedules', 'schedule', 'doctor'),

    -- Doctor CRUD permissions (from doctor components/pages)
    ('examination.create', 'Create Examinations', 'examination', 'doctor'),

    ('appointment.create', 'Create Appointments', 'appointment', 'doctor'),
    ('appointment.edit', 'Edit Appointments', 'appointment', 'doctor'),
    ('appointment.delete', 'Delete Appointments', 'appointment', 'doctor'),

    ('schedule.create', 'Create Schedules', 'schedule', 'doctor'),
    ('schedule.edit', 'Edit Schedules', 'schedule', 'doctor'),
    ('schedule.delete', 'Delete Schedules', 'schedule', 'doctor'),

    -- Doctor actions (from components)

    -- Medical record file (admin pages?)

    -- Patient
    
    -- Patient
    ('patient.view', 'View Patient', 'patient', 'patient'),
    ('patient.create', 'Create Patient', 'patient', 'patient'),
    ('patient.edit', 'Edit Patient', 'patient', 'patient'),
    ('patient.delete', 'Delete Patient', 'patient', 'patient'),

    -- Department
    ('department.view', 'View Department', 'department', 'doctor'),
    ('department.create', 'Create Department', 'department', 'doctor'),
    ('department.edit', 'Edit Department', 'department', 'doctor'),
    ('department.delete', 'Delete Department', 'department', 'doctor'),

    -- Report
    ('report.view', 'View Report', 'report', 'admin'),
    ('report.export', 'Export Report', 'report', 'admin'),

    -- Nurse (admin pages use nurse.view)
    ('nurse.view', 'View Nurse', 'nurse', 'nurse'),
    ('nurse.create', 'Create Nurse', 'nurse', 'nurse'),
    ('nurse.edit', 'Edit Nurse', 'nurse', 'nurse'),
    ('nurse.delete', 'Delete Nurse', 'nurse', 'nurse'),

    -- Admin-only extra permission (from migration)
    ('user.impersonate', 'Login as User', 'user', 'admin')

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
            -- Doctor main areas (from app/pages/doctor)
            'dashboard.view',
            'examination.view',
            'medical.view',
            'appointment.view',
            'patient-history.view',
            'referrals.view',
            'referrals.create',
            'schedule.view',

            -- Doctor CRUD permissions (from doctor components/pages)
            'examination.create',

            'appointment.create',
            'appointment.edit',
            'appointment.delete',

            'schedule.create',
            'schedule.edit',
            'schedule.delete',

            -- Existing doctor/basic permissions
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
