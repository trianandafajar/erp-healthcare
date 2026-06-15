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
        .from('doctor_schedules')
        .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            max_patients,
            is_active,
            created_at
        `)
        .eq('doctor_id', doctor.id)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { doctor_schedules: data }
})