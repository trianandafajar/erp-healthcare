export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Permission ID is required' })

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: usedByRole } = await admin
        .from('role_permissions')
        .select('role_id')
        .eq('permission_id', id)
        .limit(1)

    if (usedByRole && usedByRole.length > 0) {
        throw createError({
            statusCode: 400,
            message: 'Cannot delete permission that is still assigned to a role'
        })
    }

    const { data: before } = await admin
        .from('permissions')
        .select('*')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('permissions')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'delete',
        p_module: 'permissions',
        p_entity_id: id,
        p_description: `Deleted permission '${before?.name ?? '-'}'`,
        p_metadata: { before: before ?? null }
    })

    return { message: 'Permission deleted successfully' }
})