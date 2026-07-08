export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const query = getQuery(event)
    const admin = supabaseAdmin()

    let db = admin
        .from('call_bookings')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })

    if (query.start_date) {
        db = db.gte('booking_date', query.start_date)
    }
    if (query.end_date) {
        db = db.lte('booking_date', query.end_date)
    }
    if (query.status) {
        db = db.eq('status', query.status)
    }

    const { data, error } = await db

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data
})
