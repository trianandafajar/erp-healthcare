import { isUUID, isShortText, isNonEmptyString, isSlug, isInt, checkField, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const admin = supabaseAdmin()
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    checkField(isUUID(id), 'Invalid industry id')
    const allowed = ['title', 'description', 'image_url', 'sort_order', 'is_active', 'slug']
    const updates = Object.fromEntries(
        Object.entries(body).filter(([key]) => allowed.includes(key))
    )
    if (updates.title !== undefined) checkFormat(isNonEmptyString(updates.title) && isShortText(updates.title, 120), 'title', 'title of at most 120 characters')
    if (updates.description !== undefined) checkFormat(typeof updates.description === 'string' && updates.description.length <= 1000, 'description', 'description of at most 1000 characters')
    if (updates.image_url !== undefined) checkFormat(typeof updates.image_url === 'string' && updates.image_url.length <= 500, 'image url', 'valid image url')
    if (updates.slug != null) checkFormat(isSlug(updates.slug), 'slug', 'valid slug')
    if (updates.sort_order !== undefined) checkFormat(isInt(updates.sort_order), 'sort order', 'valid integer')
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
