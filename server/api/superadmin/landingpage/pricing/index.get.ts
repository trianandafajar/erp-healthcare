function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export default withSuperadmin(async () => {
    const admin = supabaseAdmin()

    const { data: plans, error: plansError } = await admin
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true })

    if (plansError) throw createError({ statusCode: 500, message: plansError.message })

    const { data: allFeatures, error: featuresError } = await admin
        .from('plan_features')
        .select('*')
        .order('sort_order', { ascending: true })

    if (featuresError) throw createError({ statusCode: 500, message: featuresError.message })

    const featuresByPlan = new Map<string, any[]>()
    for (const f of allFeatures ?? []) {
        const arr = featuresByPlan.get(f.plan) ?? []
        arr.push(f)
        featuresByPlan.set(f.plan, arr)
    }

    const plansWithFeatures = (plans ?? []).map((plan) => {
        const planKey = slugify(plan.title)
        const planFeats = featuresByPlan.get(planKey) ?? []
        return {
            ...plan,
            features: planFeats
                .filter((f: any) => f.feature_category === 'feature')
                .map((f: any) => f.feature_label),
            is_active: plan.is_active ?? true,
        }
    })

    return { plans: plansWithFeatures }
})
