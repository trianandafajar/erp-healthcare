export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'id is required' })

    const admin = supabaseAdmin()
    const { data: row } = await admin.from('plan_features').select('feature_key').eq('id', id).single()
    if (!row) throw createError({ statusCode: 404, message: 'Feature not found' })

    const { error } = await admin.from('plan_features').delete().eq('feature_key', row.feature_key)

    if (error) throw createError({ statusCode: 500, message: error.message })

    return { deleted: true, feature_key: row.feature_key }
})
