export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: doctor, error: doctorError } = await admin
        .from('doctors')
        .select('id')
        .eq('id', user.id)
        .single()

    if (doctorError || !doctor) {
        throw createError({ statusCode: 404, message: 'Doctor profile not found' })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await admin
        .from('appointments')
        .select(`
            id,
            patient_id,
            appointment_date,
            appointment_time,
            type,
            status,
            chief_complaint,
            notes,
            created_at,
            updated_at,
            patients (
                full_name,
                medical_record_number
            )
        `)
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', today)
        .order('appointment_date', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { appointments: data }
})