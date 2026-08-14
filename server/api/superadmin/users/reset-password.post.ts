export default withSuperadmin(async (event) => {
    const { user } = event.context
    const { id, password } = await readBody(event)

    if (!id || !password) {
        throw createError({ statusCode: 400, message: 'User ID and password are required' })
    }

    if (password.length < 8) {
        throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
    }

    const admin = supabaseAdmin()

    const { data: profile } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('id', id)
        .single()

    const { error } = await admin.auth.admin.updateUserById(id, { password })
    if (error) throw createError({ statusCode: 500, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_action: 'update',
        p_module: 'users',
        p_entity_id: id,
        p_description: `Reset password for user '${profile?.full_name ?? '-'}' (${profile?.email ?? id})`,
        p_metadata: null
    })

    return { message: 'Password reset successful' }
})
