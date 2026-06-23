export default defineEventHandler(async (event) => {
    const { patient_id, doctor_id, department_id, appointment_date, appointment_time, type, chief_complaint, notes } = await readBody(event)

    if (!patient_id || !appointment_date) {
        throw createError({ statusCode: 400, message: 'Patient and date are required' })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await admin
        .from('appointments')
        .insert({ patient_id, doctor_id, department_id, appointment_date, appointment_time, type, chief_complaint, notes })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'appointments',
        p_entity_id: data.id,
        p_description: `Created appointment for patient ${patient_id} on ${appointment_date}`,
        p_metadata: { after: data }
    })

    return { appointment: data }
})