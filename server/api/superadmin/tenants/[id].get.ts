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

    const admin = supabaseAdmin()

    const { data: tenant, error } = await admin
        .from('tenants')
        .select('*, owner_id(id, email, full_name)')
        .eq('id', tenantId)
        .single()

    if (error) throw createError({ statusCode: 404, message: 'Tenant not found' })

    const { count: userCount } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    return { ...tenant, user_count: userCount }
})