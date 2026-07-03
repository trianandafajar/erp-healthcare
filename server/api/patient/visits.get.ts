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

    const { data: appointments, error } = await admin
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
            doctors!inner (
                profiles!inner (
                full_name
                )
            ),
            departments (
                name
            ),
            medical_records (
                blood_pressure,
                heart_rate,
                temperature,
                notes,
                treatment_plan
            )
        `)
        .eq('patient_id', patient.id)
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false })

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    const statusLabel: Record<string, string> = {
        waiting: 'Scheduled',
        in_progress: 'Scheduled',
        done: 'Completed',
        cancelled: 'Cancelled',
    }

    const typeLabel: Record<string, string> = {
        appointment: 'Appointment',
        walkin: 'Walk-in',
        referral: 'Referral',
        consultation: 'Consultation',
        follow_up: 'Follow-up',
    }

    const mapped = (appointments ?? []).map((a: any) => {
        const record = a.medical_records?.[0] ?? null

        return {
            id: a.id,
            date: a.appointment_date,
            doctor: a.doctors?.profiles?.full_name ?? '-',
            department: a.departments?.name ?? '-',
            visitType: typeLabel[a.type] ?? a.type ?? 'Appointment',
            complaint: a.chief_complaint ?? '-',
            queueNumber: a.queue_number,
            status: statusLabel[a.status] ?? a.status ?? 'Scheduled',
            notes: a.notes ?? record?.notes ?? '-',
            followUp: record?.treatment_plan ?? '-',
            vitalSigns: {
                bloodPressure: record?.blood_pressure ?? '-',
                heartRate: record?.heart_rate ? `${record.heart_rate} bpm` : '-',
                temperature: record?.temperature ? `${record.temperature} °C` : '-',
            }
        }
    })

    return { visits: mapped }
})