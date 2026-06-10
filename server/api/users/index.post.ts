export default defineEventHandler(async (event) => {
    const { email, password, full_name, role, status } = await readBody(event)

    if (!email || !password || !full_name) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, and full name are required.',
        })
    }

    const admin = supabaseAdmin()

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: role ?? 'staff' },
    })

    if (error) throw createError({ statusCode: 400, message: error.message })

    if (status && data.user) {
        await admin.from('profiles').update({ status }).eq('id', data.user.id)
    }

    return { user: data.user }
})