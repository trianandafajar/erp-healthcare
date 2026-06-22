export default defineEventHandler(async (event) => {
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

    const { data, error } = await admin
        .from('appointments')
        .select(`
            id,
            appointment_date,
            appointment_time,
            type,
            status,
            chief_complaint,
            notes,
            department_id,
            doctor_id,
            doctors!appointments_doctor_id_fkey (
            id,
            profiles!doctors_id_fkey (
                full_name
            )
            )
        `)
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: false })

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    return { appointments: data }
})

