import { isUUID, isEnum, checkField, checkFormat } from '~~/server/utils/validate'

const SUBSCRIPTION_PLANS = ['free', 'starter', 'basic', 'pro', 'professional', 'enterprise']
const SUBSCRIPTION_STATUSES = ['active', 'suspended', 'trial', 'cancelled']

export default withSuperadmin(async (event) => {
    const { user } = event.context

    const body = await readBody(event)
    checkField(isUUID(body.tenant_id), 'Invalid tenant id')
    checkFormat(isEnum(body.plan, SUBSCRIPTION_PLANS), 'plan', `one of: ${SUBSCRIPTION_PLANS.join(', ')}`)
    if (body.status !== undefined) checkFormat(isEnum(body.status, SUBSCRIPTION_STATUSES), 'status', `one of: ${SUBSCRIPTION_STATUSES.join(', ')}`)

    const admin = supabaseAdmin()

    const existing = await admin
        .from('tenant_subscriptions')
        .select('id')
        .eq('tenant_id', body.tenant_id)
        .maybeSingle()

    if (existing.data) {
        throw createError({ statusCode: 409, message: 'Tenant already has a subscription' })
    }

    const amount = body.plan === 'free' ? 0
        : body.plan === 'basic' ? 49
        : body.plan === 'pro' ? 99
        : body.plan === 'enterprise' ? 199
        : 0

    const { data, error } = await admin
        .from('tenant_subscriptions')
        .insert({
            tenant_id: body.tenant_id,
            plan: body.plan,
            status: body.status || 'active',
            billing_cycle: body.billing_cycle || (body.plan === 'free' ? null : 'monthly'),
            amount: body.amount ?? amount,
            currency: body.currency || 'USD',
            start_date: body.start_date || new Date().toISOString(),
            next_billing: body.next_billing || null,
            trial_ends: body.trial_ends || null,
            payment_method: body.payment_method || null,
            created_by: user.id,
        })
        .select('*, tenant:tenants(name, slug, owner_id)')
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: body.tenant_id,
        p_action: 'create',
        p_module: 'subscriptions',
        p_entity_id: data.id,
        p_description: `Created ${body.plan} subscription for tenant ${body.tenant_id}`,
        p_metadata: { after: { plan: body.plan, status: body.status || 'active' } },
    })

    return data
})
