export default defineEventHandler(async () => {
    const admin = supabaseAdmin()
    const { data, error } = await admin
        .from('landingpage_industries')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { industries: data }
})
