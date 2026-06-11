export default defineEventHandler(async (event) => {
    const { email, password, full_name } = await readBody(event)

    if (!email || !password || !full_name) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, and full name are required.',
        })
    }

    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    // register user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name },
        },
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