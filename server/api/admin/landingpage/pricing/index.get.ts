export default defineEventHandler(async () => {
    const { data, error } = await supabaseAdmin()
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { plans: data }
})
