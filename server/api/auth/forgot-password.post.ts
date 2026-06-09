export default defineEventHandler(async (event) => {
    const { email } = await readBody(event)

    const supabase = serverSupabase(event)
    const baseURL = getRequestURL(event).origin

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseURL}/reset-password`,
    })

    if (error) {
        throw createError({
            statusCode: 400,
            message: error.message,
        })
    }

    return {
        message: 'Reset link has been sent to your email address.'
    }
})