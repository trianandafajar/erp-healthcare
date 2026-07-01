export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const admin = supabaseAdmin()

    const { data: industry, error } = await admin
        .from('landingpage_industries')
        .select('id, title, description, image_url, slug')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (error || !industry)
        throw createError({
            statusCode: 404,
            message: 'Industry not found'
        })

    const { data: detail } = await admin
        .from('industry_details')
        .select('content')
        .eq('industry_id', industry.id)
        .maybeSingle()

    return { ...industry, detail: detail?.content ?? {} }
})
