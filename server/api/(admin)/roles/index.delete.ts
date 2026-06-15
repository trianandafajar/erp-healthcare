export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, message: 'Role ID is required' })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: usersWithRole } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role_id', id)
        .limit(1)

    if (usersWithRole && usersWithRole.length > 0) {
        throw createError({
            statusCode: 400,
            message: 'Cannot delete role that is still assigned to users'
        })
    }

    const { data: before } = await admin
        .from('roles')
        .select('*')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('roles')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'delete',
        p_module: 'roles',
        p_entity_id: id,
        p_description: `Deleted role '${before?.label ?? '-'}'`,
        p_metadata: { before: before ?? null }
    })

    return { message: 'Role deleted successfully' }
})