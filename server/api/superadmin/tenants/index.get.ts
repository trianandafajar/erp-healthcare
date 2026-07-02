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

    const admin = supabaseAdmin()

    const { data: tenants, error } = await admin
        .from('tenants')
        .select('*, owner_id(id, email, full_name)')
        .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 500, message: error.message })

    return tenants
})