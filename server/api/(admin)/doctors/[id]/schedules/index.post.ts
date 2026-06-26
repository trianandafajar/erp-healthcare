export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const body = await readBody(event)
    const { day_of_week, start_time, end_time, max_patients } = body

    if (day_of_week === undefined || !start_time || !end_time) {
        throw createError({
            statusCode: 400,
            message: 'day_of_week, start_time, and end_time are required',
        })
    }

    const { data, error } = await admin
        .from('doctor_schedules')
        .insert({
            doctor_id: doctorId,
            day_of_week,
            start_time,
            end_time,
            max_patients: max_patients ?? null,
            is_active: true,
        })
        .select()
        .single()
        .returns<any>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { data }
})