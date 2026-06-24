import { Resend } from 'resend'
import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
    const { email } = await readBody(event)

    if (!email) {
        throw createError({ statusCode: 400, message: 'Email is required' })
    }

    const supabase = serverSupabase(event)
    const config = useRuntimeConfig()
    const baseURL = getRequestURL(event).origin

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60)

    await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('email', email)

    const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({ email, token, expires_at: expiresAt.toISOString() })

    if (insertError) {
        throw createError({ statusCode: 500, message: 'Failed to generate reset token' })
    }

    const resend = new Resend(config.resendApiKey)
    const resetLink = `${baseURL}/reset-password?token=${token}`

    const { error: emailError } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset Your HealthData Password',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                        
                            <tr>
                                <td style="background:#1976d2;padding:32px 40px;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">HealthData</h1>
                                    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Healthcare Management System</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:40px 40px 32px;">
                                    <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:600;">Reset Your Password</h2>
                                    <p style="margin:0 0 24px;color:#555f6e;font-size:15px;line-height:1.6;">
                                        We received a request to reset the password for your HealthData account. 
                                        Click the button below to create a new password.
                                    </p>

                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding:8px 0 32px;">
                                                <a href="${resetLink}"
                                                   style="display:inline-block;padding:14px 36px;background:#1976d2;color:#ffffff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.2px;">
                                                    Reset Password
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="background:#f0f7ff;border-left:4px solid #1976d2;border-radius:4px;padding:14px 16px;">
                                                <p style="margin:0;color:#1976d2;font-size:13px;font-weight:500;">
                                                    This link will expire in <strong>1 hour</strong>.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:24px 0 0;color:#8a94a6;font-size:13px;line-height:1.6;">
                                        If the button above doesn't work, copy and paste this URL into your browser:
                                        <br>
                                        <a href="${resetLink}" style="color:#1976d2;word-break:break-all;">${resetLink}</a>
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 40px;">
                                    <hr style="border:none;border-top:1px solid #edf0f4;margin:0;">
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:24px 40px;text-align:center;">
                                    <p style="margin:0 0 8px;color:#aab4c0;font-size:12px;line-height:1.6;">
                                        If you didn't request a password reset, you can safely ignore this email.<br>
                                        Your password will remain unchanged.
                                    </p>
                                    <p style="margin:0;color:#c8cfd8;font-size:11px;">
                                        © ${new Date().getFullYear()} HealthData · All rights reserved
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
        throw createError({ statusCode: 500, message: 'Failed to send reset email' })
    }

    return { message: 'Reset link has been sent to your email address.' }
})