import { isShortText, isNonEmptyString, isInt, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { name, role, institution, quote, rating, image_url, sort_order } = body

    checkFormat(isNonEmptyString(name) && isShortText(name, 120), 'name', 'name of at most 120 characters')
    checkFormat(isNonEmptyString(quote) && isShortText(quote, 2000), 'quote', 'quote of at most 2000 characters')
    if (role !== undefined) checkFormat(typeof role === 'string' && role.length <= 120, 'role', 'role of at most 120 characters')
    if (institution !== undefined) checkFormat(typeof institution === 'string' && institution.length <= 120, 'institution', 'institution of at most 120 characters')
    if (rating !== undefined) checkFormat(isInt(rating, { min: 1, max: 5 }), 'rating', 'integer between 1 and 5')
    if (sort_order !== undefined) checkFormat(isInt(sort_order), 'sort order', 'valid integer')

    const { data, error } = await supabaseAdmin()
        .from('landingpage_testimonials')
        .insert({
            name: name || '',
            role: role || '',
            institution: institution || '',
            quote: quote || '',
            rating: rating ?? 5,
            image_url: image_url || '/landingpage/testimonials/placeholder.jpg',
            sort_order: sort_order ?? 0,
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { testimonial: data }
})