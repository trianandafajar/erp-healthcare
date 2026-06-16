export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const body = await readBody<{ currentPassword?: string; newPassword?: string }>(event)
    const { currentPassword, newPassword } = body ?? {}

    if (!currentPassword || !newPassword) {
        throw createError({ statusCode: 400, message: 'Current and new password are required' })
    }

    if (newPassword.length < 6) {
        throw createError({ statusCode: 400, message: 'New password must be at least 6 characters' })
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    })

    if (signInError) {
        throw createError({ statusCode: 401, message: 'Current password is incorrect' })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
        throw createError({ statusCode: 500, message: updateError.message })
    }

    return { success: true }
})