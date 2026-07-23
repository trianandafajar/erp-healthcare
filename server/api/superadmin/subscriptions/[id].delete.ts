export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing subscription id' })

    const admin = supabaseAdmin()

    const { data: existing, error: fetchError } = await admin
        .from('tenant_subscriptions')
        .select('id, tenant_id, plan')
        .eq('id', id)
        .single()

    if (fetchError || !existing) {
        throw createError({ statusCode: 404, message: 'Subscription not found' })
    }

    const { error } = await admin
        .from('tenant_subscriptions')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 500, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: existing.tenant_id,
        p_action: 'delete',
        p_module: 'subscriptions',
        p_entity_id: id,
        p_description: `Deleted ${existing.plan} subscription for tenant ${existing.tenant_id}`,
        p_metadata: { deleted: existing },
    })

    return { message: 'Subscription deleted' }
})
