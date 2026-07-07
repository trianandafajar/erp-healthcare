export default defineEventHandler(async (event) => {
    const signature = getHeader(event, 'stripe-signature')
    if (!signature) {
        throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })
    }

    const rawBody = await readRawBody(event, 'utf-8')
    if (!rawBody) {
        throw createError({ statusCode: 400, message: 'Missing request body' })
    }

    let stripeEvent: any
    try {
        stripeEvent = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        )
    } catch (err: any) {
        console.error('Stripe webhook error:', err.message)
        throw createError({ statusCode: 400, message: `Webhook signature verification failed: ${err.message}` })
    }

    const admin = supabaseAdmin()

    switch (stripeEvent.type) {
        case 'checkout.session.completed': {
            const session = stripeEvent.data.object as any
            const tenantId = session.client_reference_id
            const subscriptionId = session.subscription as string

            if (!tenantId || !subscriptionId) break

            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['items.data.price.product'],
            }) as any

            const firstItem = subscription.items?.data?.[0]
            const priceId = firstItem?.price?.id

            const rawPeriodEnd = firstItem?.current_period_end
            const rawPeriodStart = firstItem?.current_period_start
            const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null
            const currentPeriodStart = rawPeriodStart ? new Date(rawPeriodStart * 1000).toISOString() : null

            let planName = 'free'
            if (priceId) {
                const { data: pricingPlan } = await admin
                    .from('pricing_plans')
                    .select('title')
                    .or(`stripe_price_id.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
                    .maybeSingle()

                if (pricingPlan) {
                    planName = pricingPlan.title.toLowerCase()
                }
            }

            await admin
                .from('tenant_subscriptions')
                .update({
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: subscriptionId,
                    stripe_price_id: priceId,
                    plan: planName,
                    status: subscription.status === 'active' ? 'active' : subscription.status,
                    next_billing: currentPeriodEnd,
                    start_date: currentPeriodStart,
                    updated_at: new Date().toISOString(),
                })
                .eq('tenant_id', tenantId)
            break
        }

        case 'customer.subscription.updated': {
            const subscription = stripeEvent.data.object as any
            const subscriptionId = subscription.id

            const firstItem = subscription.items?.data?.[0]
            const priceId = firstItem?.price?.id

            const rawPeriodEnd = firstItem?.current_period_end
            const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null

            const updates: Record<string, any> = {
                status: subscription.status === 'active' ? 'active' : subscription.status,
                next_billing: currentPeriodEnd,
                stripe_price_id: priceId,
                updated_at: new Date().toISOString(),
            }

            if (priceId) {
                const { data: pricingPlan } = await admin
                    .from('pricing_plans')
                    .select('title')
                    .or(`stripe_price_id.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
                    .maybeSingle()

                if (pricingPlan) {
                    updates.plan = pricingPlan.title.toLowerCase()
                }
            }

            await admin
                .from('tenant_subscriptions')
                .update(updates)
                .eq('stripe_subscription_id', subscriptionId)
            break
        }

        case 'customer.subscription.deleted': {
            const subscription = stripeEvent.data.object as any
            await admin
                .from('tenant_subscriptions')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('stripe_subscription_id', subscription.id)
            break
        }
    }

    return { received: true }
})