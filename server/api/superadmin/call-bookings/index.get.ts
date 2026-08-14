export default withSuperadmin(async (event) => {
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
