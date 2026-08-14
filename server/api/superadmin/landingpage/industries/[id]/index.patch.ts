export default withSuperadmin(async (event) => {
    const admin = supabaseAdmin()
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const allowed = ['title', 'description', 'image_url', 'sort_order', 'is_active', 'slug']
    const updates = Object.fromEntries(
        Object.entries(body).filter(([key]) => allowed.includes(key))
    )
    updates.updated_at = new Date().toISOString()

    const { data, error } = await admin
        .from('landingpage_industries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { industry: data }
})
