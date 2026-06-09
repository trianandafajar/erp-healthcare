export default defineEventHandler(async (event) => {
    const { email, password, full_name, role } = await readBody(event)

    if (!email || !password || !full_name) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, dan fullname wajib diisi',
        })
    }

    const supabase = serverSupabase(event)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                role: role ?? 'admin',
            },
        },
    })

    if (error) {
        throw createError({
            statusCode: 401,
            message: error.message,
        })
    }

    return {
        user: data.user,
        session: data.session,
    }
})