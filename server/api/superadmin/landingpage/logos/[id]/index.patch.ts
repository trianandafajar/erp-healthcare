export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const allowed = ['title', 'image_url', 'sort_order', 'is_active']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin()
        .from('landingpage_logos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { logo: data }
})
