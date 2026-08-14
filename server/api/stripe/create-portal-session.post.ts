import { requireUser } from '~~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
    const { user } = await requireUser(event)
    const body = await readBodyObject(event)
    const tenantId = body?.tenant_id

    if (!tenantId) {
        throw createError({ statusCode: 400, message: 'tenant_id is required' })
    }

    checkFormat(isUUID(tenantId), 'tenant_id', 'UUID')

    const admin = supabaseAdmin()

    const { data: tenantData, error: tenantError } = await admin
        .from('tenants')
        .select('id, name, owner_id')
        .eq('id', tenantId)
        .maybeSingle()

    if (tenantError || !tenantData) throw createError({ statusCode: 404, message: 'Tenant not found' })

    const { data: userRoles } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')

    if (!isSuperadmin && tenantData.owner_id !== user.id) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const { data: subscription } = await admin
        .from('tenant_subscriptions')
        .select('stripe_customer_id')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
        const { data: ownerData } = await admin
            .from('profiles')
            .select('full_name')
            .eq('id', tenantData.owner_id)
            .maybeSingle()

        const customer = await stripe.customers.create({
            name: tenantData.name,
            email: ownerData?.full_name || undefined,
            metadata: { tenant_id: tenantId },
        })
        customerId = customer.id

        await admin
            .from('tenant_subscriptions')
            .update({ stripe_customer_id: customerId })
            .eq('tenant_id', tenantId)
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${getRequestURL(event).origin}/login`,
    })

    return { url: session.url }
})
