export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const tenantId = body?.tenant_id

    if (!tenantId) {
        throw createError({ statusCode: 400, message: 'tenant_id is required' })
    }

    const admin = supabaseAdmin()

    const { data: subscription } = await admin
        .from('tenant_subscriptions')
        .select('stripe_customer_id')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
        const { data: tenantData } = await admin
            .from('tenants')
            .select('name, owner_id')
            .eq('id', tenantId)
            .single()

        if (!tenantData) throw createError({ statusCode: 404, message: 'Tenant not found' })

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
