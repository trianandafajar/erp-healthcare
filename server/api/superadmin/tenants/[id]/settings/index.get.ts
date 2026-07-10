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
    const { data, error } = await admin
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data ?? null
})
