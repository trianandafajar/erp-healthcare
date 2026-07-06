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

    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('tenant_subscriptions')
        .select('*, tenant:tenants(name, slug, owner_id)')
        .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data
})
