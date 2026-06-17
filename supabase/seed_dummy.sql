-- Dummy seed for fast local development/testing.
-- Run this after the base schema migrations.
-- Uses Supabase auth insert so the `handle_new_user` trigger can create
-- profiles, user_roles, and the default patient row automatically.
--
-- Default password for every seeded auth user: Password123!
-- If your auth schema differs, keep the public table inserts and adjust
-- only the auth.users section.

begin;

-- -------------------------------------------------------------------
-- Roles
-- -------------------------------------------------------------------
insert into public.roles (id, name, label)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'admin', 'Admin'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'doctor', 'Doctor'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'nurse', 'Nurse'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'patient', 'Patient'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'pharmacy', 'Pharmacy'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'specialist', 'Specialist')
on conflict (name) do update
set label = excluded.label;

-- -------------------------------------------------------------------
-- Departments
-- -------------------------------------------------------------------
insert into public.departments (id, name, code, description)
values
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'General Medicine', 'GM', 'Primary care and general consultations'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Pediatrics', 'PED', 'Child health services'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Nursing Unit', 'NUR', 'Nursing care and monitoring'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'Pharmacy', 'PHR', 'Medication dispensing and inventory')
on conflict (name) do update
set code = excluded.code,
    description = excluded.description;

-- -------------------------------------------------------------------
-- Auth users
-- The trigger on auth.users will create profiles + user_roles.
-- -------------------------------------------------------------------
insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
values
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@demo.local',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Admin User","role":"admin"}'::jsonb,
        now(),
        now()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'doctor.andi@demo.local',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Dr. Andi Pratama","role":"doctor"}'::jsonb,
        now(),
        now()
    ),
    (
        '22222222-2222-2222-2222-222222222223',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'doctor.sarah@demo.local',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Dr. Sarah Wijaya","role":"doctor"}'::jsonb,
        now(),
        now()
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'nurse.lisa@demo.local',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Nurse Lisa","role":"nurse"}'::jsonb,
        now(),
        now()
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'pharmacy@demo.local',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Pharmacy User","role":"pharmacy"}'::jsonb,
        now(),
        now()
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'patient.siti@demo.local',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Siti Aisyah","role":"patient"}'::jsonb,
        now(),
        now()
    )
on conflict (id) do nothing;

-- -------------------------------------------------------------------
-- Doctor / nurse profile tables
-- -------------------------------------------------------------------
insert into public.doctors (
    id,
    department_id,
    specialization,
    str_number,
    sip_number,
    phone,
    biography,
    experience_years,
    consultation_fee,
    is_available
)
values
    (
        '22222222-2222-2222-2222-222222222222',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        'Internal Medicine',
        'STR-DR-2026-001',
        'SIP-DR-2026-001',
        '+62-811-0000-001',
        'Internal medicine specialist focused on outpatient and inpatient care.',
        8,
        250000,
        true
    ),
    (
        '22222222-2222-2222-2222-222222222223',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        'Cardiology',
        'STR-DR-2026-002',
        'SIP-DR-2026-002',
        '+62-811-0000-002',
        'Cardiology doctor handling cardiac follow-up and medication review.',
        12,
        350000,
        true
    )
on conflict (id) do update
set department_id = excluded.department_id,
    specialization = excluded.specialization,
    str_number = excluded.str_number,
    sip_number = excluded.sip_number,
    phone = excluded.phone,
    biography = excluded.biography,
    experience_years = excluded.experience_years,
    consultation_fee = excluded.consultation_fee,
    is_available = excluded.is_available;

insert into public.nurses (
    id,
    department_id,
    phone,
    experience_years,
    is_available
)
values
    (
        '33333333-3333-3333-3333-333333333333',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
        '+62-811-0000-101',
        5,
        true
    )
on conflict (id) do update
set department_id = excluded.department_id,
    phone = excluded.phone,
    experience_years = excluded.experience_years,
    is_available = excluded.is_available;

-- -------------------------------------------------------------------
-- Patients
-- One patient is created automatically from auth.users.
-- More patients are seeded directly for testing.
-- -------------------------------------------------------------------
insert into public.patients (
    id,
    profile_id,
    full_name,
    date_of_birth,
    gender,
    phone,
    address,
    blood_type,
    medical_record_number
)
values
    (
        '66666666-6666-6666-6666-666666666661',
        null,
        'Budi Santoso',
        '1987-03-12',
        'male',
        '+62-811-2000-001',
        'Bandung',
        'O',
        'RM-2026-00002'
    ),
    (
        '66666666-6666-6666-6666-666666666662',
        null,
        'Rina Permata',
        '1993-09-24',
        'female',
        '+62-811-2000-002',
        'Jakarta',
        'A',
        'RM-2026-00003'
    ),
    (
        '66666666-6666-6666-6666-666666666663',
        null,
        'Andi Pratama',
        '1978-05-08',
        'male',
        '+62-811-2000-003',
        'Bekasi',
        'B',
        'RM-2026-00004'
    )
on conflict (medical_record_number) do update
set full_name = excluded.full_name,
    date_of_birth = excluded.date_of_birth,
    gender = excluded.gender,
    phone = excluded.phone,
    address = excluded.address,
    blood_type = excluded.blood_type;

-- -------------------------------------------------------------------
-- Doctor schedules
-- -------------------------------------------------------------------
insert into public.doctor_schedules (
    id,
    doctor_id,
    day_of_week,
    start_time,
    end_time,
    max_patients,
    is_active
)
values
    (
        '77777777-7777-7777-7777-777777777771',
        '22222222-2222-2222-2222-222222222222',
        1,
        '08:00',
        '12:00',
        12,
        true
    ),
    (
        '77777777-7777-7777-7777-777777777772',
        '22222222-2222-2222-2222-222222222223',
        3,
        '13:00',
        '17:00',
        10,
        true
    )
on conflict (id) do update
set doctor_id = excluded.doctor_id,
    day_of_week = excluded.day_of_week,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    max_patients = excluded.max_patients,
    is_active = excluded.is_active;

-- -------------------------------------------------------------------
-- Nurse schedules
-- -------------------------------------------------------------------
insert into public.nurse_schedules (
    id,
    nurse_id,
    day_of_week,
    start_time,
    end_time,
    max_patients,
    is_active
)
values
    (
        '88888888-8888-8888-8888-888888888881',
        '33333333-3333-3333-3333-333333333333',
        1,
        '07:00',
        '15:00',
        15,
        true
    ),
    (
        '88888888-8888-8888-8888-888888888882',
        '33333333-3333-3333-3333-333333333333',
        4,
        '07:00',
        '15:00',
        15,
        true
    )
on conflict (id) do update
set nurse_id = excluded.nurse_id,
    day_of_week = excluded.day_of_week,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    max_patients = excluded.max_patients,
    is_active = excluded.is_active;

-- -------------------------------------------------------------------
-- Appointments
-- -------------------------------------------------------------------
insert into public.appointments (
    id,
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    type,
    status,
    chief_complaint,
    notes
)
values
    (
        '99999999-9999-9999-9999-999999999991',
        '66666666-6666-6666-6666-666666666661',
        '22222222-2222-2222-2222-222222222222',
        current_date,
        '08:30',
        'appointment',
        'waiting',
        'Fever and cough',
        'Initial consultation queue'
    ),
    (
        '99999999-9999-9999-9999-999999999992',
        '66666666-6666-6666-6666-666666666662',
        '22222222-2222-2222-2222-222222222222',
        current_date,
        '09:00',
        'walkin',
        'in_progress',
        'Chest discomfort',
        'Doctor already seeing the patient'
    ),
    (
        '99999999-9999-9999-9999-999999999993',
        '66666666-6666-6666-6666-666666666663',
        '22222222-2222-2222-2222-222222222223',
        current_date,
        '10:00',
        'appointment',
        'done',
        'Follow up blood pressure',
        'Completed and ready for record creation'
    )
on conflict (id) do update
set patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    appointment_date = excluded.appointment_date,
    appointment_time = excluded.appointment_time,
    type = excluded.type,
    status = excluded.status,
    chief_complaint = excluded.chief_complaint,
    notes = excluded.notes;

-- -------------------------------------------------------------------
-- Medical records
-- -------------------------------------------------------------------
insert into public.medical_records (
    id,
    appointment_id,
    patient_id,
    doctor_id,
    blood_pressure,
    heart_rate,
    temperature,
    weight,
    height,
    subjective,
    objective,
    diagnosis,
    icd10_code,
    treatment_plan,
    notes
)
values
    (
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        '99999999-9999-9999-9999-999999999993',
        '66666666-6666-6666-6666-666666666663',
        '22222222-2222-2222-2222-222222222223',
        '128/82',
        78,
        36.7,
        72.50,
        168.00,
        'Patient complains of mild headache.',
        'Vitals stable, no distress.',
        'Hypertension controlled',
        'I10',
        'Continue monitoring and low salt diet.',
        'Follow-up in one week.'
    )
on conflict (id) do update
set appointment_id = excluded.appointment_id,
    patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    blood_pressure = excluded.blood_pressure,
    heart_rate = excluded.heart_rate,
    temperature = excluded.temperature,
    weight = excluded.weight,
    height = excluded.height,
    subjective = excluded.subjective,
    objective = excluded.objective,
    diagnosis = excluded.diagnosis,
    icd10_code = excluded.icd10_code,
    treatment_plan = excluded.treatment_plan,
    notes = excluded.notes;

-- -------------------------------------------------------------------
-- Pharmacy prescriptions
-- Requires the pharmacy prescription status migration to be applied.
-- -------------------------------------------------------------------
insert into public.prescriptions (
    id,
    medical_record_id,
    patient_id,
    doctor_id,
    medication_name,
    dosage,
    frequency,
    duration,
    instructions,
    status,
    pharmacist_note,
    rejection_note,
    verified_at,
    dispensed_at,
    created_at,
    updated_at
)
values
    (
        'bbbbbbbb-cccc-dddd-eeee-fffffffffff1',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        '66666666-6666-6666-6666-666666666663',
        '22222222-2222-2222-2222-222222222223',
        'Amlodipine',
        '5 mg',
        'Once daily',
        '30 days',
        'Take after breakfast',
        'Pending',
        null,
        null,
        null,
        null,
        now() - interval '2 days',
        now() - interval '2 days'
    ),
    (
        'bbbbbbbb-cccc-dddd-eeee-fffffffffff2',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        '66666666-6666-6666-6666-666666666663',
        '22222222-2222-2222-2222-222222222223',
        'Paracetamol',
        '500 mg',
        'Three times daily',
        '5 days',
        'Take after meals if fever persists',
        'Verified',
        'Checked dose and frequency.',
        null,
        now() - interval '1 day',
        null,
        now() - interval '1 day',
        now() - interval '1 day'
    ),
    (
        'bbbbbbbb-cccc-dddd-eeee-fffffffffff3',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        '66666666-6666-6666-6666-666666666663',
        '22222222-2222-2222-2222-222222222223',
        'Ondansetron',
        '4 mg',
        'As needed',
        '3 days',
        'Use for nausea control',
        'Dispensed',
        'Dispensed with patient counseling.',
        null,
        now() - interval '12 hours',
        now() - interval '11 hours',
        now() - interval '12 hours',
        now() - interval '11 hours'
    )
on conflict (id) do update
set medical_record_id = excluded.medical_record_id,
    patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    medication_name = excluded.medication_name,
    dosage = excluded.dosage,
    frequency = excluded.frequency,
    duration = excluded.duration,
    instructions = excluded.instructions,
    status = excluded.status,
    pharmacist_note = excluded.pharmacist_note,
    rejection_note = excluded.rejection_note,
    verified_at = excluded.verified_at,
    dispensed_at = excluded.dispensed_at,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

-- -------------------------------------------------------------------
-- Nurse vitals
-- -------------------------------------------------------------------
insert into public.nurse_vital_signs (
    id,
    patient_id,
    recorded_by,
    blood_pressure,
    temperature,
    weight,
    height,
    pulse,
    notes,
    recorded_at,
    created_at,
    updated_at
)
values
    (
        'cccccccc-dddd-eeee-ffff-000000000001',
        '66666666-6666-6666-6666-666666666661',
        '33333333-3333-3333-3333-333333333333',
        '120/80',
        36.7,
        68.40,
        170.00,
        78,
        'Stable after morning check.',
        now() - interval '2 hours',
        now() - interval '2 hours',
        now() - interval '2 hours'
    ),
    (
        'cccccccc-dddd-eeee-ffff-000000000002',
        '66666666-6666-6666-6666-666666666662',
        '33333333-3333-3333-3333-333333333333',
        '145/90',
        38.2,
        74.10,
        165.00,
        110,
        'Observation needed due to fever.',
        now() - interval '1 hour',
        now() - interval '1 hour',
        now() - interval '1 hour'
    )
on conflict (id) do update
set patient_id = excluded.patient_id,
    recorded_by = excluded.recorded_by,
    blood_pressure = excluded.blood_pressure,
    temperature = excluded.temperature,
    weight = excluded.weight,
    height = excluded.height,
    pulse = excluded.pulse,
    notes = excluded.notes,
    recorded_at = excluded.recorded_at,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

-- -------------------------------------------------------------------
-- Nurse care notes
-- -------------------------------------------------------------------
insert into public.nurse_care_notes (
    id,
    patient_id,
    recorded_by,
    category,
    note,
    author_name,
    recorded_at,
    created_at,
    updated_at
)
values
    (
        'dddddddd-eeee-ffff-0000-111111111111',
        '66666666-6666-6666-6666-666666666661',
        '33333333-3333-3333-3333-333333333333',
        'Observation',
        'Patient breathing comfortably and able to eat.',
        'Nurse Lisa',
        now() - interval '90 minutes',
        now() - interval '90 minutes',
        now() - interval '90 minutes'
    ),
    (
        'dddddddd-eeee-ffff-0000-111111111112',
        '66666666-6666-6666-6666-666666666662',
        '33333333-3333-3333-3333-333333333333',
        'Medication',
        'Antipyretic administered, monitor fever trend.',
        'Nurse Lisa',
        now() - interval '45 minutes',
        now() - interval '45 minutes',
        now() - interval '45 minutes'
    )
on conflict (id) do update
set patient_id = excluded.patient_id,
    recorded_by = excluded.recorded_by,
    category = excluded.category,
    note = excluded.note,
    author_name = excluded.author_name,
    recorded_at = excluded.recorded_at,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

-- -------------------------------------------------------------------
-- Nurse procedures
-- -------------------------------------------------------------------
insert into public.nurse_procedures (
    id,
    patient_id,
    procedure_name,
    scheduled_at,
    ended_at,
    priority,
    status,
    notes,
    recorded_by,
    created_at,
    updated_at
)
values
    (
        'eeeeeeee-ffff-0000-1111-222222222221',
        '66666666-6666-6666-6666-666666666661',
        'Wound dressing change',
        now() + interval '2 hours',
        null,
        'High',
        'Planned',
        'Prepare sterile dressing set.',
        '33333333-3333-3333-3333-333333333333',
        now(),
        now()
    ),
    (
        'eeeeeeee-ffff-0000-1111-222222222222',
        '66666666-6666-6666-6666-666666666662',
        'IV line inspection',
        now() - interval '1 hour',
        now() - interval '30 minutes',
        'Medium',
        'Completed',
        'Line functioning well, no infiltration.',
        '33333333-3333-3333-3333-333333333333',
        now() - interval '1 hour',
        now() - interval '30 minutes'
    )
on conflict (id) do update
set patient_id = excluded.patient_id,
    procedure_name = excluded.procedure_name,
    scheduled_at = excluded.scheduled_at,
    ended_at = excluded.ended_at,
    priority = excluded.priority,
    status = excluded.status,
    notes = excluded.notes,
    recorded_by = excluded.recorded_by,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

-- -------------------------------------------------------------------
-- Activity logs
-- -------------------------------------------------------------------
insert into public.activity_logs (
    id,
    actor_id,
    action,
    module,
    entity_id,
    description,
    metadata,
    created_at
)
values
    (
        'ffffffff-0000-1111-2222-333333333331',
        '22222222-2222-2222-2222-222222222222',
        'create',
        'medical_records',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        'Created dummy medical record and prescriptions for testing',
        '{"seed": true, "role": "doctor"}'::jsonb,
        now() - interval '1 day'
    ),
    (
        'ffffffff-0000-1111-2222-333333333332',
        '33333333-3333-3333-3333-333333333333',
        'create',
        'nurse_vitals',
        'cccccccc-dddd-eeee-ffff-000000000001',
        'Recorded vital signs for patient monitoring',
        '{"seed": true, "role": "nurse"}'::jsonb,
        now() - interval '2 hours'
    )
on conflict (id) do update
set actor_id = excluded.actor_id,
    action = excluded.action,
    module = excluded.module,
    entity_id = excluded.entity_id,
    description = excluded.description,
    metadata = excluded.metadata,
    created_at = excluded.created_at;

commit;
