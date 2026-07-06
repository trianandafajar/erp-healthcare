export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const admin = supabaseAdmin()

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
