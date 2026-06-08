import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const { password, access_token, refresh_token } = await readBody(event)

    const supabase = await serverSupabaseClient(event)

    const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    if (sessionError) {
        throw createError({
            statusCode: 400,
            message: sessionError.message,
        })
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        throw createError({
            statusCode: 400,
            message: error.message,
        })
    }

    return {
        message: 'Password berhasil diubah'
    }
})