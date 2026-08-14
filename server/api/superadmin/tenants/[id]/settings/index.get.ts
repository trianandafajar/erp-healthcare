export default withSuperadmin(async (event) => {
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
