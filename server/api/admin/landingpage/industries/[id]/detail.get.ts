export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('industry_details')
        .select('content')
        .eq('industry_id', id)
        .maybeSingle()

    if (error) throw createError({ statusCode: 400, message: error.message })
    return data?.content ?? {}
})
