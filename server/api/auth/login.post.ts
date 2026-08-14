import { isEmail, isNonEmptyString, checkFormat } from '~~/server/utils/validate'

export default defineEventHandler(async (event) => {
    const { email, password } = await readBody(event)

    checkFormat(isEmail(email), 'email', 'valid email address')
    checkFormat(isNonEmptyString(password), 'password', 'password')

    const supabase = serverSupabase(event)

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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