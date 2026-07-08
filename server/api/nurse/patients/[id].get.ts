import { getTenantContext } from "~~/server/utils/getTenantContext"
import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event: any) => {
    requirePlanFeature(event, 'nurse_module')
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, message: 'Patient ID is required' })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: patient, error: patientError } = await admin
        .from('patients')
        .select(`
            id,
            profile_id,
            full_name,
            date_of_birth,
            gender,
            phone,
            address,
            blood_type,
            medical_record_number,
            created_at,
            profiles (
                id,
                email,
                avatar_url,
                status
            )
        `)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

    if (patientError || !patient) {
        throw createError({ statusCode: 404, message: 'Patient not found' })
    }

    const { data: appointments } = await admin
        .from('appointments')
        .select(`
            id,
            appointment_date,
            appointment_time,
            type,
            status,
            chief_complaint,
            notes,
            queue_number,
            created_at,
            doctors (
                id,
                specialization,
                profiles (
                    full_name,
                    avatar_url
                )
            ),
            departments (
                id,
                name,
                code
            )
        `)
        .eq('patient_id', id)
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false })

    const { data: medicalRecords } = await admin
        .from('medical_records')
        .select(`
            id,
            diagnosis,
            icd10_code,
            subjective,
            objective,
            treatment_plan,
            notes,
            blood_pressure,
            heart_rate,
            temperature,
            weight,
            height,
            created_at,
            doctors (
                id,
                specialization,
                profiles (
                    full_name
                )
            )
        `)
        .eq('patient_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    const { data: vitals } = await admin
        .from('nurse_vital_signs')
        .select(`
            id,
            blood_pressure,
            temperature,
            weight,
            height,
            pulse,
            notes,
            recorded_at,
            profiles!recorded_by (
                full_name
            )
        `)
        .eq('patient_id', id)
        .order('recorded_at', { ascending: false })

    const { data: prescriptions } = await admin
        .from('prescriptions')
        .select(`
            id,
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
            doctors (
                id,
                profiles (
                    full_name
                )
            )
        `)
        .eq('patient_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    const { data: billing } = await admin
        .from('billing')
        .select(`
            id,
            invoice_number,
            service_name,
            department,
            amount,
            status,
            payment_method,
            service_date,
            paid_at,
            created_at
        `)
        .eq('patient_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    const { data: referrals } = await admin
        .from('referrals')
        .select(`
            id,
            reason,
            notes,
            status,
            created_at,
            doctors!from_doctor_id (
                id,
                profiles (
                    full_name
                )
            ),
            departments!to_department_id (
                id,
                name,
                code
            )
        `)
        .eq('patient_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    const totalBilling = (billing ?? []).reduce((sum, b) => sum + Number(b.amount ?? 0), 0)
    const unpaidBilling = (billing ?? [])
        .filter(b => b.status !== 'paid')
        .reduce((sum, b) => sum + Number(b.amount ?? 0), 0)

    return {
        patient,
        appointments: appointments ?? [],
        medical_records: medicalRecords ?? [],
        vitals: vitals ?? [],
        prescriptions: prescriptions ?? [],
        billing: billing ?? [],
        referrals: referrals ?? [],
        summary: {
            total_appointments: appointments?.length ?? 0,
            total_medical_records: medicalRecords?.length ?? 0,
            total_vitals: vitals?.length ?? 0,
            total_prescriptions: prescriptions?.length ?? 0,
            total_billing: totalBilling,
            unpaid_billing: unpaidBilling,
            total_referrals: referrals?.length ?? 0,
        }
    }
})