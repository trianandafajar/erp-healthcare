export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const allowed = ['title', 'subtitle', 'price', 'yearly_price', 'currency', 'features', 'button_label', 'button_link', 'is_recommended', 'badge_text', 'sort_order', 'is_active']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }
    updates.updated_at = new Date().toISOString()

    const { data: existing } = await supabaseAdmin()
        .from('pricing_plans')
        .select('*')
        .eq('id', id)
        .single()

    if (!existing) throw createError({ statusCode: 404, message: 'Plan not found' })

    if (existing.stripe_product_id) {
        const stripeUpdates: Record<string, any> = {}
        if (updates.title !== undefined) stripeUpdates.name = updates.title
        if (updates.subtitle !== undefined) stripeUpdates.description = updates.subtitle

        if (Object.keys(stripeUpdates).length > 0) {
            await stripe.products.update(existing.stripe_product_id, stripeUpdates)
        }

        if (updates.price !== undefined && updates.price !== Number(existing.price)) {
            const currency = (updates.currency || existing.currency).toLowerCase()
            const newPrice = await stripe.prices.create({
                product: existing.stripe_product_id,
                unit_amount: Math.round(updates.price * 100),
                currency,
                recurring: { interval: 'month' },
            })
            updates.stripe_price_id = newPrice.id
        }

        if (updates.yearly_price !== undefined && updates.yearly_price !== Number(existing.yearly_price)) {
            const currency = (updates.currency || existing.currency).toLowerCase()
            if (updates.yearly_price > 0) {
                const newYearlyPrice = await stripe.prices.create({
                    product: existing.stripe_product_id,
                    unit_amount: Math.round(updates.yearly_price * 100),
                    currency,
                    recurring: { interval: 'year' },
                })
                updates.stripe_price_id_yearly = newYearlyPrice.id
            } else {
                updates.stripe_price_id_yearly = null
            }
        }
    }

    const { data, error } = await supabaseAdmin()
        .from('pricing_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { plan: data }
})
