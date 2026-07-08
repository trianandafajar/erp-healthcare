export async function requirePlanFeature(event: any, feature: string) {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        throw createError({ statusCode: 403, message: 'No tenant found' })
    }

    const admin = supabaseAdmin()
    const { data: sub } = await admin
        .from('tenant_subscriptions')
        .select('plan')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle()

    const plan = (sub?.plan as string) ?? 'starter'

    const { data: featureRow } = await admin
        .from('plan_features')
        .select('is_available')
        .eq('plan', plan)
        .eq('feature_key', feature)
        .maybeSingle()

    if (!featureRow?.is_available) {
        throw createError({
            statusCode: 403,
            message: `Your ${plan} plan does not include "${feature}". Please upgrade to access this feature.`,
        })
    }
}
