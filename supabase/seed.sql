    -- =========================
    -- Seed Roles
    -- =========================

    INSERT INTO public.roles (name, label)
    VALUES
    ('superadmin', 'Super Administrator'),
    ('admin', 'Administrator'),
    ('doctor', 'Doctor'),
    ('pharmacy', 'Pharmacist'),
    ('receptionist', 'Receptionist'),
    ('nurse', 'Nurse'),
    ('patient', 'Patient')
    ON CONFLICT (name) DO NOTHING;

    -- =========================
    -- Seed Default Tenant
    -- =========================

    INSERT INTO public.tenants (name, slug)
    VALUES ('Default', 'default')
    ON CONFLICT (slug) DO NOTHING;

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

    -- Nurse area pages
    ('dashboard.view', 'View Dashboard', 'dashboard', 'nurse'),
    ('care-notes.view', 'View Care Notes', 'care-notes', 'nurse'),
    ('care-notes.create', 'Create Care Notes', 'care-notes', 'nurse'),
    ('care-notes.edit', 'Edit Care Notes', 'care-notes', 'nurse'),
    ('care-notes.delete', 'Delete Care Notes', 'care-notes', 'nurse'),
    ('monitoring.view', 'View Patient Monitoring', 'monitoring', 'nurse'),
    ('procedures.view', 'View Procedures', 'procedures', 'nurse'),
    ('procedures.create', 'Create Procedures', 'procedures', 'nurse'),
    ('procedures.edit', 'Edit Procedures', 'procedures', 'nurse'),
    ('procedures.delete', 'Delete Procedures', 'procedures', 'nurse'),
    ('vitals.view', 'View Vital Signs', 'vitals', 'nurse'),
    ('vitals.create', 'Create Vital Signs', 'vitals', 'nurse'),
    ('vitals.edit', 'Edit Vital Signs', 'vitals', 'nurse'),
    ('vitals.delete', 'Delete Vital Signs', 'vitals', 'nurse'),

    -- Pharmacy area pages
    ('dispensing.view', 'View Dispensing', 'dispensing', 'pharmacy'),
    ('prescriptions.view', 'View Prescriptions', 'prescriptions', 'pharmacy'),
    ('verification.view', 'View Verification', 'verification', 'pharmacy'),
    ('stock.view', 'View Stock', 'stock', 'pharmacy'),
    ('stock-in.view', 'View Incoming Stock', 'stock-in', 'pharmacy'),
    ('stock-out.view', 'View Outgoing Stock', 'stock-out', 'pharmacy'),

    -- Pharmacy actions
    ('prescriptions.verify', 'Verify Prescription', 'prescriptions', 'pharmacy'),
    ('prescriptions.reject', 'Reject Prescription', 'prescriptions', 'pharmacy'),
    ('prescriptions.dispense', 'Dispense Prescription', 'prescriptions', 'pharmacy'),
    ('stock.create', 'Create Stock Item', 'stock', 'pharmacy'),
    ('stock.edit', 'Edit Stock Item', 'stock', 'pharmacy'),
    ('stock.adjust', 'Adjust Stock', 'stock', 'pharmacy'),

    -- Receptionist area pages
    ('billing.view', 'View Billing', 'billing', 'receptionist'),
    ('check-in.view', 'View Check-in', 'check-in', 'receptionist'),
    ('queue.view', 'View Queue', 'queue', 'receptionist'),
    ('queue.print', 'Print Queue', 'queue', 'receptionist'),
    ('patient-regist.view', 'View Patient Registration', 'patient-regist', 'receptionist'),

    -- Receptionist actions
    ('billing.pay', 'Mark Billing as Paid', 'billing', 'receptionist'),
    ('schedule.status', 'Update Schedule Status', 'schedule', 'receptionist'),
    ('patient-regist.create', 'Register Patient', 'patient-regist', 'receptionist'),
    ('queue.update', 'Update Queue Status', 'queue', 'receptionist'),
    ('check-in.create', 'Confirm Check-in', 'check-in', 'receptionist'),
    ('billing.create', 'Create Billing', 'billing', 'receptionist'),

    -- Patient portal pages
    ('book-appt.view', 'View Book Appointment', 'book-appt', 'patient'),
    ('book-appt.create', 'Create Appointment', 'book-appt', 'patient'),
    ('book-appt.edit', 'Edit Appointment', 'book-appt', 'patient'),
    ('book-appt.delete', 'Delete Appointment', 'book-appt', 'patient'),
    ('diagnoses.view', 'View Diagnoses', 'diagnoses', 'patient'),
    ('payments.view', 'View Payments', 'payments', 'patient'),
    ('payments.pay', 'Make Payment', 'payments', 'patient'),
    ('visits.view', 'View Visits', 'visits', 'patient'),
    ('doctor-schedule.view', 'View Doctor Schedules', 'doctor-schedule', 'patient'),
    ('profile.view', 'View Profile', 'profile', 'patient'),
    ('examination.download', 'Download Examination Result', 'examination', 'patient'),

    -- Admin-only extra permission (from migration)
    ('user.impersonate', 'Login as User', 'user', 'admin'),

    -- Landing Page
    ('landingpage.industries.view', 'View Industries', 'landingpage', 'admin'),
    ('landingpage.industries.create', 'Create Industries', 'landingpage', 'admin'),
    ('landingpage.industries.edit', 'Edit Industries', 'landingpage', 'admin'),
    ('landingpage.industries.delete', 'Delete Industries', 'landingpage', 'admin'),
    ('landingpage.logos.view', 'View Logos', 'landingpage', 'admin'),
    ('landingpage.logos.create', 'Create Logos', 'landingpage', 'admin'),
    ('landingpage.logos.edit', 'Edit Logos', 'landingpage', 'admin'),
    ('landingpage.logos.delete', 'Delete Logos', 'landingpage', 'admin'),
    ('landingpage.testimonials.view', 'View Testimonials', 'landingpage', 'admin'),
    ('landingpage.testimonials.create', 'Create Testimonials', 'landingpage', 'admin'),
    ('landingpage.testimonials.edit', 'Edit Testimonials', 'landingpage', 'admin'),
    ('landingpage.testimonials.delete', 'Delete Testimonials', 'landingpage', 'admin'),
    ('landingpage.pricing.view', 'View Pricing Plans', 'landingpage', 'admin'),
    ('landingpage.pricing.create', 'Create Pricing Plans', 'landingpage', 'admin'),
    ('landingpage.pricing.edit', 'Edit Pricing Plans', 'landingpage', 'admin'),
    ('landingpage.pricing.delete', 'Delete Pricing Plans', 'landingpage', 'admin'),

    -- Pharmacy (admin master data)
    ('pharmacy.view', 'View Pharmacists', 'pharmacy', 'admin'),
    ('pharmacy.create', 'Create Pharmacist', 'pharmacy', 'admin'),
    ('pharmacy.edit', 'Edit Pharmacist', 'pharmacy', 'admin'),
    ('pharmacy.delete', 'Delete Pharmacist', 'pharmacy', 'admin'),

    -- Receptionist (admin master data)
    ('receptionist.view', 'View Receptionists', 'receptionist', 'admin'),
    ('receptionist.create', 'Create Receptionist', 'receptionist', 'admin'),
    ('receptionist.edit', 'Edit Receptionist', 'receptionist', 'admin'),
    ('receptionist.delete', 'Delete Receptionist', 'receptionist', 'admin')

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
        -- SUPERADMIN (all permissions)
        -- =====================

        SELECT id INTO v_role_id
        FROM public.roles
        WHERE name = 'superadmin';

        FOR v_perm_id IN
            SELECT id FROM public.permissions
        LOOP
            INSERT INTO public.role_permissions(role_id, permission_id)
            VALUES (v_role_id, v_perm_id)
            ON CONFLICT DO NOTHING;
        END LOOP;

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
        -- PHARMACY
        -- =====================

        SELECT id INTO v_role_id
        FROM public.roles
        WHERE name = 'pharmacy';

        perm_names := ARRAY[
            -- Pages
            'dashboard.view',
            'patient.view',
            'prescriptions.view',
            'dispensing.view',
            'verification.view',
            'stock.view',
            'stock-in.view',
            'stock-out.view',

            -- Prescription actions
            'prescriptions.verify',
            'prescriptions.reject',
            'prescriptions.dispense',

            -- Stock actions
            'stock.create',
            'stock.edit',
            'stock.adjust'
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
        -- RECEPTIONIST
        -- =====================

        SELECT id INTO v_role_id
        FROM public.roles
        WHERE name = 'receptionist';

        perm_names := ARRAY[
            -- Pages
            'dashboard.view',
            'patient.view',
            'patient.create',
            'patient.edit',
            'doctor.view',
            'department.view',
            'appointment.view',
            'schedule.view',
            'billing.view',
            'check-in.view',
            'queue.view',
            'queue.print',
            'patient-regist.view',

            -- Actions
            'appointment.create',
            'appointment.edit',
            'billing.pay',
            'schedule.create',
            'schedule.edit',
            'schedule.delete',
            'schedule.status',
            'patient-regist.create',
            'queue.update',
            'check-in.create',
            'billing.create'
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
        -- NURSE
        -- =====================

        SELECT id INTO v_role_id
        FROM public.roles
        WHERE name = 'nurse';

        perm_names := ARRAY[
            -- Pages
            'dashboard.view',
            'patient.view',

            -- Care Notes
            'care-notes.view',
            'care-notes.create',
            'care-notes.edit',
            'care-notes.delete',

            -- Monitoring
            'monitoring.view',

            -- Procedures
            'procedures.view',
            'procedures.create',
            'procedures.edit',
            'procedures.delete',

            -- Vitals
            'vitals.view',
            'vitals.create',
            'vitals.edit',
            'vitals.delete'
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
        -- PATIENT
        -- =====================

        SELECT id INTO v_role_id
        FROM public.roles
        WHERE name = 'patient';

        perm_names := ARRAY[
            -- Pages
            'dashboard.view',
            'book-appt.view',
            'diagnoses.view',
            'examination.view',
            'payments.view',
            'prescriptions.view',
            'visits.view',
            'doctor-schedule.view',
            'profile.view',

            -- Actions
            'book-appt.create',
            'book-appt.edit',
            'book-appt.delete',
            'examination.download',
            'payments.pay'
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
