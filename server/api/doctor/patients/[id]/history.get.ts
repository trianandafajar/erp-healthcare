export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const patientId = getRouterParam(event, 'id')

    if (!patientId) {
        throw createError({ statusCode: 400, message: 'Patient ID is required' })
    }

    const [
        { data: appointments, error: apptError },
        { data: medicalRecords, error: mrError },
        { data: referrals, error: refError },
    ] = await Promise.all([
        admin
            .from('appointments')
            .select(`
                id,
                appointment_date,
                appointment_time,
                type,
                status,
                chief_complaint,
                created_at,
                doctors (
                    profiles ( full_name )
                ),
                departments:department_id (
                    name
                )
            `)
            .eq('patient_id', patientId)
            .returns<any[]>(),

        admin
            .from('medical_records')
            .select(`
                id,
                diagnosis,
                treatment_plan,
                created_at,
                doctors (
                    profiles ( full_name )
                ),
                prescriptions ( id, medication_name )
            `)
            .eq('patient_id', patientId)
            .returns<any[]>(),

        admin
            .from('referrals')
            .select(`
                id,
                reason,
                status,
                created_at,
                from_doctor:from_doctor_id ( profiles ( full_name ) ),
                departments:to_department_id ( name )
            `)
            .eq('patient_id', patientId)
            .returns<any[]>(),
    ])

    if (apptError) throw createError({ statusCode: 400, message: apptError.message })
    if (mrError) throw createError({ statusCode: 400, message: mrError.message })
    if (refError) throw createError({ statusCode: 400, message: refError.message })

    const timeline: any[] = []

    appointments?.forEach((a) => {
        timeline.push({
            type: 'appointment',
            id: a.id,
            timestamp: a.created_at,
            title: a.type === 'walkin' ? 'Walk-in Visit' : a.type === 'referral' ? 'Referral Appointment' : 'Appointment Booked',
            description: a.chief_complaint ?? null,
            doctor_name: a.doctors?.profiles?.full_name ?? null,
            department_name: a.departments?.name ?? null,
            status: a.status,
        })
    })

    medicalRecords?.forEach((m) => {
        timeline.push({
            type: 'medical_record',
            id: m.id,
            timestamp: m.created_at,
            title: 'Examination Completed',
            description: m.diagnosis ?? null,
            doctor_name: m.doctors?.profiles?.full_name ?? null,
            prescription_count: m.prescriptions?.length ?? 0,
            status: null,
        })
    })

    referrals?.forEach((r) => {
        timeline.push({
            type: 'referral',
            id: r.id,
            timestamp: r.created_at,
            title: `Referred to ${r.departments?.name ?? 'department'}`,
            description: r.reason ?? null,
            doctor_name: r.from_doctor?.profiles?.full_name ?? null,
            status: r.status,
        })
    })

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return { timeline }
})