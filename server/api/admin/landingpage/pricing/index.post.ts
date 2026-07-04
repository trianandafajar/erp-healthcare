export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { title, subtitle, price, yearly_price, currency, features, button_label, button_link, is_recommended, badge_text, sort_order } = body

    const { data, error } = await supabaseAdmin()
        .from('pricing_plans')
        .insert({
            title: title || '',
            subtitle: subtitle || '',
            price: price ?? 0,
            yearly_price: yearly_price ?? null,
            currency: currency || 'USD',
            features: features ?? [],
            button_label: button_label || 'Get Started',
            button_link: button_link || '/contact',
            is_recommended: is_recommended ?? false,
            badge_text: badge_text || '',
            sort_order: sort_order ?? 0,
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { plan: data }
})
