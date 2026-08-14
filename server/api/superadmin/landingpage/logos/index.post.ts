import { isShortText, isNonEmptyString, isInt, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { title, image_url, sort_order } = body

    checkFormat(isNonEmptyString(title) && isShortText(title, 120), 'title', 'title of at most 120 characters')
    if (image_url !== undefined) checkFormat(typeof image_url === 'string' && image_url.length <= 500, 'image url', 'valid image url')
    if (sort_order !== undefined) checkFormat(isInt(sort_order), 'sort order', 'valid integer')

    const { data, error } = await supabaseAdmin()
        .from('landingpage_logos')
        .insert({
            title: title || 'Logo',
            image_url: image_url || '/landingpage/sponsors/placeholder.png',
            sort_order: sort_order ?? 0,
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { logo: data }
})
