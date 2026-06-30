export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const {
        doctor_id,
        department_id,
        appointment_date,
        appointment_time,
        type,
        status,
        chief_complaint,
        notes,
    } = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, message: 'Appointment ID is required' })
    }
    if (!doctor_id || !appointment_date || !appointment_time || !type || !status) {
        throw createError({ statusCode: 400, message: 'doctor, date, time, type, and status are required' })
    }
    if (!['waiting', 'cancelled'].includes(status)) {
        throw createError({ statusCode: 400, message: 'Invalid appointment status' })
    }

    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const {
        data: patient,
        error: patientError,
    } = await admin
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .single()
        .returns<{ id: string }>()

    if (patientError || !patient) {
        throw createError({ statusCode: 404, message: 'Patient profile not found' })
    }

    const { data: before, error: beforeError } = await admin
        .from('appointments')
        .select('*')
        .eq('id', id)
        .eq('patient_id', patient.id)
        .single()

    if (beforeError || !before) {
        throw createError({ statusCode: 404, message: 'Appointment not found' })
    }

    const { data: appointment, error: updateError } = await admin
        .from('appointments')
        .update({
            doctor_id,
            department_id: department_id ?? null,
            appointment_date,
            appointment_time,
            type,
            status,
            chief_complaint: chief_complaint ?? null,
            notes: notes ?? null,
        })
        .eq('id', id)
        .eq('patient_id', patient.id)
        .select()
        .single()

    if (updateError) {
        throw createError({ statusCode: 400, message: updateError.message })
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_action: 'update',
        p_module: 'appointments',
        p_entity_id: appointment.id,
        p_description: `Patient updated appointment ${id}`,
        p_metadata: {
            before,
            after: appointment,
        },
    })

    return { appointment }
})
