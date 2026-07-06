import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
    const { name, email, subject, message } = await readBody(event)

    if (!name || !email || !message) {
        throw createError({ statusCode: 400, message: 'Name, email, and message are required' })
    }

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
