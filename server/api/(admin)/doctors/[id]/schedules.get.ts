export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const { active_only } = getQuery(event)

    let q = admin
        .from('doctor_schedules')
        .select('id, day_of_week, start_time, end_time, max_patients, is_active, created_at')
        .eq('doctor_id', doctorId)
        .order('day_of_week')
        .order('start_time')

    if (active_only === 'true') q = q.eq('is_active', true)

    const { data, error } = await q.returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { data: data ?? [] }
})