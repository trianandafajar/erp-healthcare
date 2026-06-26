export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const [
        { data: doctor, error: doctorError },
        { data: schedules, error: scheduleError },
        { data: appointments, error: apptError },
        { data: medicalRecords, error: mrError },
        { data: referrals, error: refError },
        { data: prescriptions, error: prError },
    ] = await Promise.all([
        admin
            .from('doctors')
            .select(`
                id,
                specialization,
                str_number,
                sip_number,
                phone,
                biography,
                experience_years,
                consultation_fee,
                is_available,
                created_at,
                updated_at,
                profiles ( full_name, email, avatar_url, status ),
                departments:department_id ( id, name, code, description )
            `)
            .eq('id', doctorId)
            .single()
            .returns<any>(),

        admin
            .from('doctor_schedules')
            .select('id, day_of_week, start_time, end_time, max_patients, is_active')
            .eq('doctor_id', doctorId)
            .eq('is_active', true)
            .order('day_of_week')
            .returns<any[]>(),
        admin
            .from('appointments')
            .select('id, status, appointment_date, patient_id')
            .eq('doctor_id', doctorId)
            .returns<any[]>(),
        admin
            .from('medical_records')
            .select('id, patient_id, created_at')
            .eq('doctor_id', doctorId)
            .returns<any[]>(),

        admin
            .from('referrals')
            .select('id, status')
            .eq('from_doctor_id', doctorId)
            .returns<any[]>(),
        admin
            .from('prescriptions')
            .select('id, status')
            .eq('doctor_id', doctorId)
            .returns<any[]>(),
    ])

    if (doctorError) throw createError({ statusCode: 404, message: 'Doctor not found' })
    if (scheduleError) throw createError({ statusCode: 400, message: scheduleError.message })
    if (apptError) throw createError({ statusCode: 400, message: apptError.message })
    if (mrError) throw createError({ statusCode: 400, message: mrError.message })
    if (refError) throw createError({ statusCode: 400, message: refError.message })
    if (prError) throw createError({ statusCode: 400, message: prError.message })

    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const apptList = appointments ?? []
    const uniquePatients = new Set(apptList.map((a) => a.patient_id))

    const stats = {
        total_appointments: apptList.length,
        total_patients: uniquePatients.size,
        appointments_today: apptList.filter((a) => a.appointment_date === today).length,
        appointments_this_month: apptList.filter((a) => a.appointment_date?.startsWith(thisMonth)).length,
        completed: apptList.filter((a) => a.status === 'completed').length,
        pending: apptList.filter((a) => a.status === 'pending').length,
        cancelled: apptList.filter((a) => a.status === 'cancelled').length,
        in_progress: apptList.filter((a) => a.status === 'in_progress').length,
        total_medical_records: (medicalRecords ?? []).length,
        total_prescriptions: (prescriptions ?? []).length,
        total_referrals_sent: (referrals ?? []).length,
    }

    return {
        ...doctor,
        active_schedules: schedules ?? [],
        stats,
    }
})