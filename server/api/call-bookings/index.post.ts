import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'
import { isEmail, isShortText, isNonEmptyString, isDateYMD, checkFormat } from '~~/server/utils/validate'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { name, email, phone, message, booking_date, booking_time } = body

    checkFormat(isNonEmptyString(name) && isShortText(name, 120), 'name', 'name of at most 120 characters')
    checkFormat(isEmail(email), 'email', 'valid email address')
    checkFormat(isDateYMD(booking_date), 'booking date', 'valid date')
    checkFormat(isNonEmptyString(booking_time) && booking_time.length <= 10, 'booking time', 'valid time')
    if (phone !== undefined) checkFormat(typeof phone === 'string' && phone.length <= 30, 'phone', 'phone number of at most 30 characters')
    if (message !== undefined) checkFormat(typeof message === 'string' && message.length <= 1000, 'message', 'message of at most 1000 characters')

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
