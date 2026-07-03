import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: patient, error: patientError } = await admin
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (patientError || !patient) {
        throw createError({ statusCode: 404, message: 'Patient profile not found' })
    }

    const { data: rows, error } = await admin
        .from('prescriptions')
        .select(`
            id,
            created_at,
            medical_record_id,
            medication_name,
            dosage,
            frequency,
            duration,
            instructions,
            status,
            doctors (
                profiles (
                full_name
                )
            ),
            medical_records (
                appointment_id,
                appointments (
                departments (
                    name
                )
                )
            )
        `)
        .eq('patient_id', patient.id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    const grouped = new Map<string, any>()

    for (const r of rows ?? []) {
        const key = r.medical_record_id ?? r.id

        const med = {
            medication: r.medication_name ?? '-',
            dosage: r.dosage ?? '-',
            frequency: r.frequency ?? '-',
            duration: r.duration ?? '-',
            instructions: r.instructions
                ? r.instructions.split(/\r?\n+/).map((s: string) => s.trim()).filter(Boolean)
                : [],
        }

        if (grouped.has(key)) {
            grouped.get(key).medications.push(med)
        } else {
            grouped.set(key, {
                id: r.id,
                prescribedAt: r.created_at,
                doctor: r.doctors?.profiles?.full_name ?? '-',
                department: r.medical_records?.appointments?.departments?.name ?? '-',
                visitReference: r.medical_records?.appointment_id ?? '-',
                status: r.status ?? 'Pending',
                pharmacistNote: r.pharmacist_note ?? null,
                rejectionNote: r.rejection_note ?? null,
                verifiedAt: r.verified_at ?? null,
                dispensedAt: r.dispensed_at ?? null,
                medications: [med],
            })
        } 
    }

    return { prescriptions: Array.from(grouped.values()) }
})