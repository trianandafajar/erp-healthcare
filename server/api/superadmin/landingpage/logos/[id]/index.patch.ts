import { isUUID, isShortText, isNonEmptyString, isInt, checkField, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    checkField(isUUID(id), 'Invalid logo id')
    const allowed = ['title', 'image_url', 'sort_order', 'is_active']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }
    if (updates.title !== undefined) checkFormat(isNonEmptyString(updates.title) && isShortText(updates.title, 120), 'title', 'title of at most 120 characters')
    if (updates.image_url !== undefined) checkFormat(typeof updates.image_url === 'string' && updates.image_url.length <= 500, 'image url', 'valid image url')
    if (updates.sort_order !== undefined) checkFormat(isInt(updates.sort_order), 'sort order', 'valid integer')
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
