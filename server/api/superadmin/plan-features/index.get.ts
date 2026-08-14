export default withSuperadmin(async (event) => {

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
