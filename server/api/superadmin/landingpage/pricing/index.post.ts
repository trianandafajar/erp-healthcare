export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { title, subtitle, price, yearly_price, currency, features, button_label, button_link, is_recommended, badge_text, sort_order } = body

    const product = await stripe.products.create({
        name: title || '',
        description: subtitle || undefined,
    })

    const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round((price ?? 0) * 100),
        currency: (currency || 'USD').toLowerCase(),
        recurring: { interval: 'month' },
    })

    let yearlyPriceId: string | null = null
    if (yearly_price != null && yearly_price > 0) {
        const yearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(yearly_price * 100),
            currency: (currency || 'USD').toLowerCase(),
            recurring: { interval: 'year' },
        })
        yearlyPriceId = yearlyPrice.id
    }

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
            stripe_product_id: product.id,
            stripe_price_id: monthlyPrice.id,
            stripe_price_id_yearly: yearlyPriceId,
        })
        .select()
        .single()

    if (error) {
        await stripe.products.update(product.id, { active: false })
        throw createError({ statusCode: 500, message: error.message })
    }
    return { plan: data }
})
