CREATE TABLE plan_features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan text NOT NULL CHECK (plan IN ('starter', 'basic', 'professional', 'enterprise')),
    feature_key text NOT NULL,
    feature_label text NOT NULL,
    feature_category text NOT NULL DEFAULT 'feature'
        CHECK (feature_category IN ('feature', 'limit', 'role')),
    is_available boolean NOT NULL DEFAULT false,
    limit_value integer,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE (plan, feature_key)
);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all_plan_features"
    ON plan_features
    FOR ALL
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "anon_select_plan_features"
    ON plan_features
    FOR SELECT
    USING (true);

grant select, insert, update, delete, references on table public.plan_features to authenticated;
grant select, insert, update, delete, references on table public.plan_features to service_role;
grant select on table public.plan_features to anon;

INSERT INTO plan_features (plan, feature_key, feature_label, feature_category, is_available, limit_value, sort_order) VALUES
-- Starter
('starter', 'patients', 'Patient Management', 'feature', true, null, 1),
('starter', 'medical_records', 'Medical Records', 'feature', true, null, 2),
('starter', 'appointments', 'Appointment Scheduling', 'feature', true, null, 3),
('starter', 'dashboard_basic', 'Dashboard Overview', 'feature', true, null, 4),
('starter', 'max_staff', 'Maximum Staff Accounts', 'limit', true, 5, 1),
('starter', 'max_departments', 'Maximum Departments', 'limit', true, 3, 2),
('starter', 'role_admin', 'Admin Role', 'role', true, null, 1),
('starter', 'role_doctor', 'Doctor Role', 'role', true, null, 2),
('starter', 'role_patient', 'Patient Role', 'role', true, null, 3),

-- Basic
('basic', 'patients', 'Patient Management', 'feature', true, null, 1),
('basic', 'medical_records', 'Medical Records', 'feature', true, null, 2),
('basic', 'appointments', 'Appointment Scheduling', 'feature', true, null, 3),
('basic', 'dashboard_basic', 'Dashboard Overview', 'feature', true, null, 4),
('basic', 'nurse_module', 'Nurse Module (Care Notes, Vitals, Procedures)', 'feature', true, null, 5),
('basic', 'billing', 'Billing & Invoicing', 'feature', true, null, 6),
('basic', 'queue', 'Queue Management', 'feature', true, null, 7),
('basic', 'checkin', 'Patient Check-In', 'feature', true, null, 8),
('basic', 'max_staff', 'Maximum Staff Accounts', 'limit', true, 15, 1),
('basic', 'max_departments', 'Maximum Departments', 'limit', true, 10, 2),
('basic', 'role_admin', 'Admin Role', 'role', true, null, 1),
('basic', 'role_doctor', 'Doctor Role', 'role', true, null, 2),
('basic', 'role_patient', 'Patient Role', 'role', true, null, 3),
('basic', 'role_nurse', 'Nurse Role', 'role', true, null, 4),
('basic', 'role_receptionist', 'Receptionist Role', 'role', true, null, 5),

-- Professional
('professional', 'patients', 'Patient Management', 'feature', true, null, 1),
('professional', 'medical_records', 'Medical Records', 'feature', true, null, 2),
('professional', 'appointments', 'Appointment Scheduling', 'feature', true, null, 3),
('professional', 'dashboard_advanced', 'Advanced Dashboard & Analytics', 'feature', true, null, 4),
('professional', 'nurse_module', 'Nurse Module (Care Notes, Vitals, Procedures)', 'feature', true, null, 5),
('professional', 'billing', 'Billing & Invoicing', 'feature', true, null, 6),
('professional', 'queue', 'Queue Management', 'feature', true, null, 7),
('professional', 'checkin', 'Patient Check-In', 'feature', true, null, 8),
('professional', 'pharmacy_module', 'Pharmacy Module (Prescriptions, Stock)', 'feature', true, null, 9),
('professional', 'reports', 'Reports & Data Export', 'feature', true, null, 10),
('professional', 'api_access', 'API Access', 'feature', true, null, 11),
('professional', 'multi_branch', 'Multi-Branch Management', 'feature', true, null, 12),
('professional', 'referrals', 'Referral Management', 'feature', true, null, 13),
('professional', 'activity_logs', 'Activity Logs', 'feature', true, null, 14),
('professional', 'max_staff', 'Maximum Staff Accounts', 'limit', true, 50, 1),
('professional', 'max_departments', 'Maximum Departments', 'limit', true, -1, 2),
('professional', 'role_admin', 'Admin Role', 'role', true, null, 1),
('professional', 'role_doctor', 'Doctor Role', 'role', true, null, 2),
('professional', 'role_patient', 'Patient Role', 'role', true, null, 3),
('professional', 'role_nurse', 'Nurse Role', 'role', true, null, 4),
('professional', 'role_receptionist', 'Receptionist Role', 'role', true, null, 5),
('professional', 'role_pharmacy', 'Pharmacy Role', 'role', true, null, 6),

-- Enterprise
('enterprise', 'all_features', 'All Features Included', 'feature', true, null, 1),
('enterprise', 'custom_branding', 'Custom Branding', 'feature', true, null, 2),
('enterprise', 'on_premise', 'On-Premise Option', 'feature', true, null, 3),
('enterprise', 'dedicated_support', 'Dedicated Account Manager & 24/7 Support', 'feature', true, null, 4),
('enterprise', 'max_staff', 'Maximum Staff Accounts', 'limit', true, -1, 1),
('enterprise', 'max_departments', 'Maximum Departments', 'limit', true, -1, 2);
