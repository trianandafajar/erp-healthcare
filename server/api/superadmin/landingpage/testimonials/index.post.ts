export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { name, role, institution, quote, rating, image_url, sort_order } = body

    const { data, error } = await supabaseAdmin()
        .from('landingpage_testimonials')
        .insert({
            name: name || '',
            role: role || '',
            institution: institution || '',
            quote: quote || '',
            rating: rating ?? 5,
            image_url: image_url || '/landingpage/testimonials/placeholder.jpg',
            sort_order: sort_order ?? 0,
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { testimonial: data }
})