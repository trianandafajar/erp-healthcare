import { isShortText, isNonEmptyString, isFiniteNumber, checkFormat } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { title, subtitle, price, yearly_price, currency, button_label, button_link, is_recommended, badge_text, sort_order } = body

    checkFormat(isNonEmptyString(title) && isShortText(title, 120), 'title', 'title of at most 120 characters')
    if (subtitle !== undefined) checkFormat(typeof subtitle === 'string' && subtitle.length <= 300, 'subtitle', 'subtitle of at most 300 characters')
    if (price !== undefined) checkFormat(isFiniteNumber(price) && price >= 0, 'price', 'non-negative number')
    if (yearly_price !== undefined) checkFormat(yearly_price === null || (isFiniteNumber(yearly_price) && yearly_price >= 0), 'yearly price', 'non-negative number')
    if (currency !== undefined) checkFormat(typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency), 'currency', '3-letter currency code')

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

    const admin = supabaseAdmin()

    const { data, error: insertError } = await admin
        .from('pricing_plans')
        .insert({
            title: title || '',
            subtitle: subtitle || '',
            price: price ?? 0,
            yearly_price: yearly_price ?? null,
            currency: currency || 'USD',
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

    if (insertError) {
        await stripe.products.update(product.id, { active: false })
        throw createError({ statusCode: 500, message: insertError.message })
    }

    const planKey = (title ?? '').toLowerCase().replace(/\s+/g, '_')

    const { data: existingKeys } = await admin
        .from('plan_features')
        .select('feature_key, feature_label, feature_category, sort_order, limit_value')
        .eq('plan', 'enterprise')

    if (existingKeys?.length) {
        const featureRows = existingKeys.map((f: any) => ({
            plan: planKey,
            feature_key: f.feature_key,
            feature_label: f.feature_label,
            feature_category: f.feature_category,
            is_available: false,
            limit_value: f.feature_category === 'limit' ? (f.limit_value ?? 0) : null,
            sort_order: f.sort_order ?? 0,
        }))

        const { error: featuresError } = await admin.from('plan_features').insert(featureRows)
        if (featuresError) {
            throw createError({ statusCode: 500, message: featuresError.message })
        }
    }

    return { plan: data }
})
