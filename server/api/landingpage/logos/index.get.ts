export default defineEventHandler(async () => {
    const { data, error } = await supabaseEphemeral()
        .from('landingpage_logos')
        .select('id, title, image_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { logos: data ?? [] }
})
