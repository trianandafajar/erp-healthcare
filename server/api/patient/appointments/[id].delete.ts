export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, message: 'Appointment ID is required' })
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

    const { error } = await admin
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('patient_id', patient.id)

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_action: 'delete',
        p_module: 'appointments',
        p_entity_id: id,
        p_description: `Patient deleted appointment ${id}`,
        p_metadata: {
            before,
        },
    })

    return { message: 'Appointment deleted successfully' }
})
