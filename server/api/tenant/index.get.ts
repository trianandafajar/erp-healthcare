export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        return null
    }

    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, slug, subscription_plan, subscription_status, created_at')
        .eq('id', profile.tenant_id)
        .single()

    if (error) throw createError({ statusCode: 404, message: 'Tenant not found' })

    return tenant
})