import { isUUID, checkField } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const admin = supabaseAdmin()

    checkField(isUUID(id), 'Invalid industry id')
    checkField(typeof body.content === 'object' && body.content !== null && !Array.isArray(body.content), 'content must be a valid object')

    const { data, error } = await admin
        .from('industry_details')
        .upsert({
            industry_id: id,
            content: body.content ?? {},
            updated_at: new Date().toISOString()
        }, { onConflict: 'industry_id' })
        .select('content')
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { content: data.content }
})
