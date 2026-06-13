export default defineEventHandler(async (event) => {
    const { name, label, permissions } = await readBody(event)

    if (!name || !label) {
        throw createError({ statusCode: 400, message: 'Name and label are required' })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: role, error: roleError } = await admin
        .from('roles')
        .insert({ name, label })
        .select()
        .single()

    if (roleError) throw createError({ statusCode: 400, message: roleError.message })

    if (permissions?.length > 0) {
        const rolePermissions = permissions.map((permission_id: string) => ({
            role_id: role.id,
            permission_id
        }))

        const { error: permError } = await admin
            .from('role_permissions')
            .insert(rolePermissions)

        if (permError) throw createError({ statusCode: 400, message: permError.message })
    }

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'roles',
        p_entity_id: role.id,
        p_description: `Created role '${role.label}'`,
        p_metadata: { after: { ...role, permissions: permissions ?? [] } }
    })

    return { role }
})