function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

import { isUUID, isShortText, isNonEmptyString, isFiniteNumber, checkField, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    checkField(isUUID(id), 'Invalid plan id')
    const allowed = ['title', 'subtitle', 'price', 'yearly_price', 'currency', 'button_label', 'button_link', 'is_recommended', 'badge_text', 'sort_order', 'is_active']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }
    if (updates.title !== undefined) checkFormat(isNonEmptyString(updates.title) && isShortText(updates.title, 120), 'title', 'title of at most 120 characters')
    if (updates.subtitle !== undefined) checkFormat(typeof updates.subtitle === 'string' && updates.subtitle.length <= 300, 'subtitle', 'subtitle of at most 300 characters')
    if (updates.price !== undefined) checkFormat(isFiniteNumber(updates.price) && updates.price >= 0, 'price', 'non-negative number')
    if (updates.yearly_price !== undefined) checkFormat(updates.yearly_price === null || (isFiniteNumber(updates.yearly_price) && updates.yearly_price >= 0), 'yearly price', 'non-negative number')
    if (updates.currency !== undefined) checkFormat(typeof updates.currency === 'string' && /^[A-Za-z]{3}$/.test(updates.currency), 'currency', '3-letter currency code')
    updates.updated_at = new Date().toISOString()

    const admin = supabaseAdmin()

    const { data: existing } = await admin
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

    // Handle features upsert
    if (body.features !== undefined && Array.isArray(body.features)) {
        const planKey = slugify(body.title || existing.title)
        const seen = new Set<string>()
        const featureRows = body.features
            .filter((f: string) => f.trim())
            .map((f: string, i: number) => {
                const key = slugify(f)
                if (seen.has(key)) return null
                seen.add(key)
                return {
                    plan: planKey,
                    feature_key: key,
                    feature_label: f.trim(),
                    feature_category: 'feature',
                    is_available: true,
                    sort_order: i + 1,
                }
            })
            .filter(Boolean)

        // Remove old feature-type rows for this plan
        await admin
            .from('plan_features')
            .delete()
            .eq('plan', planKey)
            .eq('feature_category', 'feature')

        // Insert new rows
        if (featureRows.length > 0) {
            const { error: fe } = await admin.from('plan_features').insert(featureRows)
            if (fe) throw createError({ statusCode: 500, message: fe.message })
        }
    }

    const { data, error } = await admin
        .from('pricing_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { plan: data }
})
