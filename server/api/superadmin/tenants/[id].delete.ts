export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const tenantId = getRouterParam(event, 'id')
    if (!tenantId) throw createError({ statusCode: 400, message: 'Tenant ID is required' })

    const admin = supabaseAdmin()

    const { data: tenant } = await admin
        .from('tenants')
        .select('id, name')
        .eq('id', tenantId)
        .single()

    if (!tenant) throw createError({ statusCode: 404, message: 'Tenant not found' })

    const { data: profiles } = await admin
        .from('profiles')
        .select('id, email')
        .eq('tenant_id', tenantId)

    const errors: string[] = []

    if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
            const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id)
            if (deleteError) {
                errors.push(`${profile.email ?? profile.id}: ${deleteError.message}`)
            }
        }
    }

    const { error: tenantDeleteError } = await admin
        .from('tenants')
        .delete()
        .eq('id', tenantId)

    if (tenantDeleteError) {
        errors.push(`tenant: ${tenantDeleteError.message}`)
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: tenantId,
        p_action: 'delete',
        p_module: 'tenants',
        p_entity_id: tenantId,
        p_description: `Deleted tenant ${tenant.name}`,
        p_metadata: { deleted_users: profiles?.length ?? 0 }
    })

    if (errors.length > 0) {
        return { message: 'Tenant deleted with some errors', errors }
    }

    return { message: 'Tenant and all associated data deleted successfully' }
})
