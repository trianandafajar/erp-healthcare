export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { title, image_url, sort_order } = body

    const { data, error } = await supabaseAdmin()
        .from('landingpage_logos')
        .insert({
            title: title || 'Logo',
            image_url: image_url || '/landingpage/sponsors/placeholder.png',
            sort_order: sort_order ?? 0,
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { logo: data }
})
