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

    const query = getQuery(event)
    const admin = supabaseAdmin()

    let db = admin
        .from('plan_features')
        .select('*')
        .order('sort_order', { ascending: true })

    if (query.plan) {
        db = db.eq('plan', query.plan)
    }

    const { data, error } = await db

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data
})
