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

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'id is required' })

    const admin = supabaseAdmin()
    const { data: row } = await admin.from('plan_features').select('feature_key').eq('id', id).single()
    if (!row) throw createError({ statusCode: 404, message: 'Feature not found' })

    const { error } = await admin.from('plan_features').delete().eq('feature_key', row.feature_key)

    if (error) throw createError({ statusCode: 500, message: error.message })

    return { deleted: true, feature_key: row.feature_key }
})
