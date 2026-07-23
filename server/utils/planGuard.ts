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

async function getPlanContext(event: any) {
    const supabase = serverSupabase(event)
const { user, tenantId } = await getTenantContext(event);
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    // const { data: profile } = await supabase
    //     .from('profiles')
    //     .select('tenant_id')
    //     .eq('id', user.id)
    //     .single()
    if (!tenantId) throw createError({ statusCode: 403, message: 'No tenant found' })

    const admin = supabaseAdmin()
    const { data: sub } = await admin
        .from('tenant_subscriptions')
        .select('plan')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    const plan = (sub?.plan as string) ?? 'starter'
    return { admin, plan }
}

export async function getPlanLimit(event: any, feature: string) {
    const { admin, plan } = await getPlanContext(event)
    const { data: row } = await admin
        .from('plan_features')
        .select('limit_value')
        .eq('plan', plan)
        .eq('feature_key', feature)
        .eq('feature_category', 'limit')
        .maybeSingle()

    return { plan, limit: row?.limit_value ?? 0 }
}

export async function requirePlanLimit(event: any, feature: string, currentCount: number) {
    const { plan, limit } = await getPlanLimit(event, feature)
    if (limit === -1) return
    if (currentCount >= limit) {
        throw createError({
            statusCode: 403,
            message: `Your ${plan} plan allows up to ${limit} ${feature.replace('max_', '')}. Please upgrade to increase this limit.`,
        })
    }
}
