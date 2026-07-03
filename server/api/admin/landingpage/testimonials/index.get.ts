export default defineEventHandler(async () => {
    const { data, error } = await supabaseAdmin()
        .from('landingpage_testimonials')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { testimonials: data }
})