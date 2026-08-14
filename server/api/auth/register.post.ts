import { Resend } from 'resend'
import { randomInt } from 'crypto'
import { isEmail, isShortText, isNonEmptyString, checkFormat, isEnum } from '~~/server/utils/validate'

const VALID_REGISTER_ROLES = ['admin', 'doctor', 'specialist', 'nurse', 'pharmacy', 'receptionist', 'patient']

export default defineEventHandler(async (event) => {
    const { email, password, full_name, role = 'admin', tenant_name, tenant_slug } = await readBody(event)

    checkFormat(isEmail(email), 'email', 'valid email address')
    checkFormat(typeof password === 'string' && password.length >= 8, 'password', 'password of at least 8 characters')
    checkFormat(isNonEmptyString(full_name) && isShortText(full_name, 120), 'full name', 'name of at most 120 characters')
    checkFormat(isEnum(role, VALID_REGISTER_ROLES), 'role', `valid role (${VALID_REGISTER_ROLES.join(', ')})`)

    const admin = supabaseAdmin()

    const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    if (existingProfile) {
        return {
            message: 'Registration successful. Please check your email for the verification code.',
            redirect: `/verify?email=${encodeURIComponent(email)}`,
        }
    }

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name, role, tenant_name, tenant_slug },
        email_confirm: false,
    })

    if (error) throw createError({ statusCode: 401, message: error.message })

    const config = useRuntimeConfig()
    const resend = new Resend(config.resendApiKey)

    if (role === 'superadmin') {
        return {
            message: 'Registration successful.',
            redirect: '/login',
        }
    }

    const otp = String(randomInt(100000, 999999))
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await admin
        .from('email_verifications')
        .delete()
        .eq('email', email)

    const { error: otpError } = await admin
        .from('email_verifications')
        .insert({ email, otp, expires_at: expiresAt.toISOString() })

    if (otpError) {
        console.error('OTP insert error:', otpError)
        throw createError({ statusCode: 500, message: 'Failed to generate verification code' })
    }

    await resend.emails.send({
        from: 'HealthData <noreply@trianandafajar.com>',
        to: email,
        subject: 'Verify Your Email Address',
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
                                    <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:600;">Verify Your Email</h2>
                                    <p style="margin:0 0 24px;color:#555f6e;font-size:15px;line-height:1.6;">
                                        Thank you for registering! Use the OTP below to verify your email address.
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="background:#f0f7ff;border-radius:8px;padding:24px;margin-bottom:24px;">
                                                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1976d2;font-family:monospace;">${otp}</span>
                                            </td>
                                        </tr>
                                    </table>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="background:#f0f7ff;border-left:4px solid #1976d2;border-radius:4px;padding:14px 16px;">
                                                <p style="margin:0;color:#1976d2;font-size:13px;font-weight:500;">
                                                    This code will expire in <strong>30 minutes</strong>.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 40px;">
                                    <hr style="border:none;border-top:1px solid #edf0f4;margin:0;">
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:24px 40px;text-align:center;">
                                    <p style="margin:0;color:#aab4c0;font-size:12px;line-height:1.6;">
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

    return {
        message: 'Registration successful. Please check your email for the verification code.',
        redirect: `/verify?email=${encodeURIComponent(email)}`,
    }
})
