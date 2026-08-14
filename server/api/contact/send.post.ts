import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'
import { isEmail, isShortText, isNonEmptyString, checkFormat } from '~~/server/utils/validate'

export default defineEventHandler(async (event) => {
    const { name, email, subject, message } = await readBody(event)

    checkFormat(isNonEmptyString(name) && isShortText(name, 120), 'name', 'name of at most 120 characters')
    checkFormat(isEmail(email), 'email', 'valid email address')
    checkFormat(isNonEmptyString(message) && isShortText(message, 2000), 'message', 'message of at most 2000 characters')
    if (subject !== undefined) checkFormat(typeof subject === 'string' && subject.length <= 200, 'subject', 'subject of at most 200 characters')

    const admin = supabaseAdmin()

    const { data: inquiry, error } = await admin
        .from('contact_inquiries')
        .insert({ name, email, subject, message })
        .select('*')
        .single()

    if (error) {
        throw createError({ statusCode: 500, message: 'Failed to save inquiry' })
    }

    const superadminIds = await getRecipientIdsByRoles(admin, ['superadmin'])

    if (superadminIds.length > 0) {
        await insertNotifications(
            admin,
            superadminIds.map((user_id) => ({
                user_id,
                type: 'contact_inquiry',
                title: 'New Contact Inquiry',
                body: `${name} sent a message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                data: {
                    inquiry_id: inquiry.id,
                    name,
                    email,
                    subject: subject ?? null,
                },
            })),
        )
    }

    return { message: 'Your message has been sent successfully.' }
})
