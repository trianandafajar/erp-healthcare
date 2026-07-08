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
    const body = await readBody(event)

    const updates: Record<string, any> = {}
    if (body.is_available !== undefined) updates.is_available = body.is_available
    if (body.limit_value !== undefined) updates.limit_value = body.limit_value
    if (body.feature_label) updates.feature_label = body.feature_label

    if (Object.keys(updates).length === 0) {
        throw createError({ statusCode: 400, message: 'No fields to update' })
    }

    const admin = supabaseAdmin()
    const { data, error } = await admin
        .from('plan_features')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data
})
