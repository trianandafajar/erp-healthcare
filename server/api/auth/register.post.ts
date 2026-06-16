export default defineEventHandler(async (event) => {
    const { email, password, full_name } = await readBody(event)

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
        user_metadata: { full_name },
        email_confirm: true,
    })

    if (error) throw createError({ statusCode: 401, message: error.message })

    // assign role admin
    if (data.user) {
        const { data: roleData } = await admin
            .from('roles')
            .select('id')
            .eq('name', 'admin')
            .single()

        if (roleData) {
            await admin
                .from('user_roles')
                .insert({ user_id: data.user.id, role_id: roleData.id })
        }
    }

    return { user: data.user }
})