import { isUUID, isEnum, checkField, checkFormat } from '~~/server/utils/validate'

const SUBSCRIPTION_PLANS = ['free', 'starter', 'basic', 'pro', 'professional', 'enterprise']
const SUBSCRIPTION_STATUSES = ['active', 'suspended', 'trial', 'cancelled']

export default withSuperadmin(async (event) => {
    const { user } = event.context

    const id = getRouterParam(event, 'id')
    checkField(isUUID(id), 'Invalid subscription id')

    const body = await readBody(event)
    if (body.plan !== undefined) checkFormat(isEnum(body.plan, SUBSCRIPTION_PLANS), 'plan', `one of: ${SUBSCRIPTION_PLANS.join(', ')}`)
    if (body.status !== undefined) checkFormat(isEnum(body.status, SUBSCRIPTION_STATUSES), 'status', `one of: ${SUBSCRIPTION_STATUSES.join(', ')}`)
    const admin = supabaseAdmin()

    const allowed = ['plan', 'status', 'billing_cycle', 'amount', 'currency', 'start_date', 'next_billing', 'trial_ends', 'payment_method']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
        throw createError({ statusCode: 400, message: 'No fields to update' })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await admin
        .from('tenant_subscriptions')
        .update(updates)
        .eq('id', id)
        .select('*, tenant:tenants(name, slug, owner_id)')
        .single()

    if (error) throw createError({ statusCode: 500, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_action: 'update',
        p_module: 'subscriptions',
        p_entity_id: id,
        p_description: `Updated subscription ${id}`,
        p_metadata: { after: updates },
    })

    return data
})
