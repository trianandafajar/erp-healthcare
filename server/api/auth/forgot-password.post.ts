import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const { email } = await readBody(event)

    const supabase = await serverSupabaseClient(event)

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
        message: 'Email reset password telah dikirim'
    }
})