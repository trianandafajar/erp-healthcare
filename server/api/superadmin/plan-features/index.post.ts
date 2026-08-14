export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { feature_key, feature_label, feature_category = 'feature', sort_order = 0, limit_value = null } = body

    if (!feature_key?.trim() || !feature_label?.trim()) {
        throw createError({ statusCode: 400, message: 'feature_key and feature_label are required' })
    }

    const admin = supabaseAdmin()
    const plans = ['starter', 'basic', 'professional', 'enterprise']

    const rows = plans.map((plan) => ({
        plan,
        feature_key: feature_key.trim(),
        feature_label: feature_label.trim(),
        feature_category,
        is_available: false,
        limit_value: feature_category === 'limit' ? (limit_value ?? 0) : null,
        sort_order: sort_order ?? 0,
    }))

    const { data, error } = await admin.from('plan_features').insert(rows).select()

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data
})
