import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin =
        userRoles?.some(({ roles }: any) => roles?.name === 'superadmin') ?? false

    if (!isSuperadmin) {
        throw createError({
            statusCode: 403,
            message: 'Forbidden',
        })
    }

    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing inquiry id' })

    const { reply_body } = await readBody(event)
    if (!reply_body) throw createError({ statusCode: 400, message: 'Reply body is required' })

    const admin = supabaseAdmin()

    const { data: inquiry, error: fetchError } = await admin
        .from('contact_inquiries')
        .select('name, email, subject')
        .eq('id', id)
        .single()

    if (fetchError || !inquiry) {
        throw createError({ statusCode: 404, message: 'Inquiry not found' })
    }

    const config = useRuntimeConfig()
    const resend = new Resend(config.resendApiKey)

    const subjectLine = inquiry.subject
        ? `Re: ${inquiry.subject} — HealthData Support`
        : 'Response from HealthData Support'

    const { error: emailError } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: inquiry.email,
        subject: subjectLine,
        html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                            <tr>
                                <td style="background:#176D37;padding:32px 40px;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">HealthData</h1>
                                    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Healthcare Management System</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:40px 40px 32px;">
                                    <p style="margin:0 0 8px;color:#555f6e;font-size:14px;">Hi ${inquiry.name},</p>
                                    <p style="margin:0 0 24px;color:#555f6e;font-size:15px;line-height:1.6;">
                                        Thank you for reaching out to us. Here is our response to your inquiry:
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="background:#f9fafb;border-left:4px solid #176D37;border-radius:4px;padding:20px 24px;">
                                                <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${reply_body}</p>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin:24px 0 0;color:#555f6e;font-size:14px;line-height:1.6;">
                                        If you have any further questions, feel free to reach out again.
                                    </p>
                                    <p style="margin:8px 0 0;color:#555f6e;font-size:14px;">Best regards,<br>The HealthData Team</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 40px;">
                                    <hr style="border:none;border-top:1px solid #edf0f4;margin:0;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:24px 40px;text-align:center;">
                                    <p style="margin:0;color:#c8cfd8;font-size:11px;">
                                        &copy; ${new Date().getFullYear()} HealthData &middot; All rights reserved
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `,
    })

    if (emailError) {
        throw createError({ statusCode: 500, message: 'Failed to send reply email' })
    }

    const { error: updateError } = await admin
        .from('contact_inquiries')
        .update({ replied: true, replied_at: new Date().toISOString(), reply_body })
        .eq('id', id)

    if (updateError) {
        throw createError({ statusCode: 500, message: 'Failed to update inquiry status' })
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_action: 'reply',
        p_module: 'contact_inquiries',
        p_entity_id: id,
        p_description: `Replied to contact inquiry from ${inquiry.name} <${inquiry.email}>`,
        p_metadata: { subject: inquiry.subject, reply_body },
    })

    return { message: 'Reply sent successfully.' }
})
