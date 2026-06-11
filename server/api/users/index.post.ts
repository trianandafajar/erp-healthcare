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
        user_metadata: { full_name },
    })

    if (error) throw createError({ statusCode: 400, message: error.message })

    const userId = data.user.id

    // update status
    if (status) {
        await admin.from('profiles').update({ status }).eq('id', userId)
    }

    // assign role ke user_roles
    if (role) {
        const { data: roleData, error: roleError } = await admin
            .from('roles')
            .select('id')
            .eq('name', role)
            .single()

        if (roleError || !roleData) {
            throw createError({ statusCode: 400, message: `Role '${role}' not found` })
        }

        const { error: userRoleError } = await admin
            .from('user_roles')
            .insert({ user_id: userId, role_id: roleData.id })

        if (userRoleError) {
            throw createError({ statusCode: 400, message: userRoleError.message })
        }
    }

    return { user: data.user }
})