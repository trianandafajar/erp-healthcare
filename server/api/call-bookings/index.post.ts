export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { name, email, phone, message, booking_date, booking_time } = body

    if (!name || !email || !booking_date || !booking_time) {
        throw createError({ statusCode: 400, message: 'name, email, booking_date, and booking_time are required' })
    }

    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('call_bookings')
        .insert({ name, email, phone, message, booking_date, booking_time })
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data
})
