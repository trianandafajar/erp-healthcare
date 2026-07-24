export default defineEventHandler(async (event) => {
    const { email, otp } = await readBody(event)

    if (!email || !otp) {
        throw createError({ statusCode: 400, message: 'Email and OTP are required' })
    }

    const supabase = supabaseAdmin()

    const { data: record, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (fetchError || !record) {
        throw createError({ statusCode: 400, message: 'No verification code found. Request a new one.' })
    }

    if (record.used_at) {
        throw createError({ statusCode: 400, message: 'This code has already been used. Request a new one.' })
    }

    if (new Date(record.expires_at) < new Date()) {
        throw createError({ statusCode: 400, message: 'Code expired. Request a new one.' })
    }

    if (record.attempts >= 3) {
        throw createError({ statusCode: 400, message: 'Too many failed attempts. Request a new code.' })
    }

    if (record.otp !== otp) {
        await supabase
            .from('email_verifications')
            .update({ attempts: record.attempts + 1 })
            .eq('id', record.id)

        const remaining = 2 - record.attempts
        throw createError({ statusCode: 400, message: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` })
    }

    await supabase
        .from('email_verifications')
        .update({ used_at: new Date().toISOString() })
        .eq('id', record.id)

    const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('email', email)
        .select('id')
        .single()

    if (updateError || !profile) {
        throw createError({ statusCode: 500, message: 'Failed to verify email' })
    }

    const { error: confirmError } = await supabase.auth.admin.updateUserById(profile.id, {
        email_confirm: true
    })

    if (confirmError) {
        throw createError({ statusCode: 500, message: 'Failed to confirm email in auth system' })
    }

    return { message: 'Email verified successfully' }
})