import { isNonEmptyString, checkFormat } from '~~/server/utils/validate'

export default defineEventHandler(async (event) => {
    const { token } = await readBody(event)

    checkFormat(isNonEmptyString(token) && token.length <= 200, 'token', 'valid reset token')

    const supabase = serverSupabase(event)

    const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (error || !data) {
        throw createError({ statusCode: 400, message: 'Invalid or expired reset token' })
    }

    return { valid: true, email: data.email }
})