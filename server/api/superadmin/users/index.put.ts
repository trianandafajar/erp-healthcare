export default defineEventHandler(async (event) => {
    const { id, full_name, role, status } = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const admin = supabaseAdmin()

    const { data: before } = await admin
        .from('profiles')
        .select('full_name, status, email, tenant_id')
        .eq('id', id)
        .single()

    if (role) {
        const { data: tenant } = await admin
            .from('tenants')
            .select('owner_id')
            .eq('id', before?.tenant_id)
            .single()

        if (tenant && tenant.owner_id === id) {
            const { data: currentRole } = await admin
                .from('user_roles')
                .select('roles(name)')
                .eq('user_id', id)
                .single()

            if (currentRole && currentRole.roles?.name !== role) {
                throw createError({ statusCode: 403, message: 'Cannot change the role of the tenant owner' })
            }
        }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
        user_metadata: { full_name, role },
    })
    if (authError) throw createError({ statusCode: 400, message: authError.message })

    const { error: profileError } = await admin
        .from('profiles')
        .update({ full_name, status })
        .eq('id', id)
    if (profileError) throw createError({ statusCode: 400, message: profileError.message })

    if (role) {
        const { data: roleData, error: roleError } = await admin
            .from('roles')
            .select('id')
            .eq('name', role)
            .single()

        if (roleError || !roleData) {
            throw createError({ statusCode: 400, message: `Role '${role}' not found` })
        }

        await admin.from('user_roles').delete().eq('user_id', id)

        const { error: userRoleError } = await admin
            .from('user_roles')
            .insert({ user_id: id, role_id: roleData.id })

        if (userRoleError) {
            throw createError({ statusCode: 400, message: userRoleError.message })
        }
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: before?.tenant_id,
        p_action: 'update',
        p_module: 'users',
        p_entity_id: id,
        p_description: `Updated user '${full_name ?? before?.full_name}' (${before?.email ?? '-'})`,
        p_metadata: {
            before: before ?? null,
            after: { full_name, role, status }
        }
    })

    return { message: 'User updated successfully' }
})
