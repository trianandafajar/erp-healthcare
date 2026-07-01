export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const body = await readBody(event)
    const { title, description, image_url, sort_order, slug } = body

    const { data, error } = await admin
        .from('landingpage_industries')
        .insert({
            title,
            description,
            image_url: image_url || 'https://placehold.co/800x600?text=Industry',
            sort_order: sort_order ?? 0,
            slug: slug || null
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { industry: data }
})
