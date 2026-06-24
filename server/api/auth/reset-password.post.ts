import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const { token, password } = await readBody(event)

    if (!token || !password) {
        throw createError({ statusCode: 400, message: 'Token and password are required' })
    }

    const supabase = serverSupabase(event)
    const config = useRuntimeConfig()

    const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (tokenError || !tokenData) {
        throw createError({ statusCode: 400, message: 'Invalid or expired reset token' })
    }

    const adminSupabase = createClient(
        config.public.supabaseUrl,
        config.supabaseServiceKey
    )

    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()
    const user = users?.find(u => u.email === tokenData.email)

    if (listError || !user) {
        throw createError({ statusCode: 404, message: 'User not found' })
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        user.id,
        { password }
    )

    if (updateError) {
        throw createError({ statusCode: 500, message: updateError.message })
    }
    
    await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token)

    return { message: 'Password reset successful' }
})