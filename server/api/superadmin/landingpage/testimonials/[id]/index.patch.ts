import { isUUID, isShortText, isNonEmptyString, isInt, checkField, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    checkField(isUUID(id), 'Invalid testimonial id')
    const allowed = ['name', 'role', 'institution', 'quote', 'rating', 'image_url', 'sort_order', 'is_active']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }
    if (updates.name !== undefined) checkFormat(isNonEmptyString(updates.name) && isShortText(updates.name, 120), 'name', 'name of at most 120 characters')
    if (updates.quote !== undefined) checkFormat(isNonEmptyString(updates.quote) && isShortText(updates.quote, 2000), 'quote', 'quote of at most 2000 characters')
    if (updates.role !== undefined) checkFormat(typeof updates.role === 'string' && updates.role.length <= 120, 'role', 'role of at most 120 characters')
    if (updates.institution !== undefined) checkFormat(typeof updates.institution === 'string' && updates.institution.length <= 120, 'institution', 'institution of at most 120 characters')
    if (updates.rating !== undefined) checkFormat(isInt(updates.rating, { min: 1, max: 5 }), 'rating', 'integer between 1 and 5')
    if (updates.sort_order !== undefined) checkFormat(isInt(updates.sort_order), 'sort order', 'valid integer')
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin()
        .from('landingpage_testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { testimonial: data }
})