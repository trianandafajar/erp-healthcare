import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

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

    const superadminIds = await getRecipientIdsByRoles(admin, ['superadmin'])
    if (superadminIds.length > 0) {
        await insertNotifications(
            admin,
            superadminIds.map((user_id) => ({
                user_id,
                type: 'call_booking',
                title: 'New Call Booking',
                body: `${name} requested a call on ${booking_date} at ${booking_time}`,
                data: {
                    booking_id: data.id,
                    name,
                    email,
                    phone: phone ?? null,
                    message: message ?? null,
                },
            })),
        )
    }

    return data
})
