export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const body = await readBody(event)
    const featureKey = body?.feature as string
    if (!featureKey) throw createError({ statusCode: 400, message: 'feature is required' })

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        return { allowed: false }
    }

    const admin = supabaseAdmin()
    const { data: sub } = await admin
        .from('tenant_subscriptions')
        .select('plan')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle()

    const plan = (sub?.plan as string) ?? 'starter'

    const { data: feature } = await admin
        .from('plan_features')
        .select('is_available')
        .eq('plan', plan)
        .eq('feature_key', featureKey)
        .maybeSingle()

    const allowed = feature?.is_available ?? false

    return { allowed, plan }
})
