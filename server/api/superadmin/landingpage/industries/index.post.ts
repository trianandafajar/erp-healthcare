import { isShortText, isNonEmptyString, isSlug, isInt, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const admin = supabaseAdmin()
    const body = await readBody(event)
    const { title, description, image_url, sort_order, slug } = body

    checkFormat(isNonEmptyString(title) && isShortText(title, 120), 'title', 'title of at most 120 characters')
    if (description !== undefined) checkFormat(typeof description === 'string' && description.length <= 1000, 'description', 'description of at most 1000 characters')
    if (image_url !== undefined) checkFormat(typeof image_url === 'string' && image_url.length <= 500, 'image url', 'valid image url')
    if (slug != null) checkFormat(isSlug(slug), 'slug', 'valid slug')
    if (sort_order !== undefined) checkFormat(isInt(sort_order), 'sort order', 'valid integer')

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
