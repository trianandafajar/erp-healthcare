export default defineEventHandler(async () => {
    const supabase = supabaseEphemeral()

    const [pricingRes, featuresRes] = await Promise.all([
        supabase
            .from('pricing_plans')
            .select('id, title, subtitle, price, yearly_price, currency, button_label, button_link, is_recommended, badge_text, sort_order, stripe_price_id, stripe_price_id_yearly')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        supabase
            .from('plan_features')
            .select('plan, feature_label, feature_category, is_available, sort_order')
            .eq('feature_category', 'feature')
            .eq('is_available', true)
            .order('sort_order', { ascending: true }),
    ])

    if (pricingRes.error) throw createError({ statusCode: 500, message: pricingRes.error.message })
    if (featuresRes.error) throw createError({ statusCode: 500, message: featuresRes.error.message })

    const groupedFeatures: Record<string, string[]> = {}
    for (const row of featuresRes.data ?? []) {
        if (!groupedFeatures[row.plan]) groupedFeatures[row.plan] = []
        groupedFeatures[row.plan].push(row.feature_label)
    }

    const plans = (pricingRes.data ?? []).map((plan: any) => {
        const planKey = (plan.title ?? '').toLowerCase()
        const dynamicFeatures = groupedFeatures[planKey]
        return {
            ...plan,
            features: dynamicFeatures?.length ? dynamicFeatures : [],
        }
    })

    return { plans }
})
