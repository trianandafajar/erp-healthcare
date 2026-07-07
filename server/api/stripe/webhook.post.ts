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
            const price = firstItem?.price
            const priceId = price?.id
            const amount = price?.unit_amount ? price.unit_amount / 100 : null
            const currency = price?.currency?.toUpperCase() || null
            const interval = price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

            const rawPeriodEnd = firstItem?.current_period_end
            const rawPeriodStart = firstItem?.current_period_start
            const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null
            const currentPeriodStart = rawPeriodStart ? new Date(rawPeriodStart * 1000).toISOString() : null

            let paymentMethod: string | null = null
            if (session.invoice) {
                const invoice = await stripe.invoices.retrieve(session.invoice as string, {
                    expand: ['payments.data.payment.payment_intent'],
                }) as any

                const invoicePayment = invoice.payments?.data?.[0]
                const paymentIntent = invoicePayment?.payment?.payment_intent

                let pm: any = null
                if (paymentIntent && typeof paymentIntent === 'object') {
                    const pmRef = paymentIntent.payment_method
                    if (pmRef && typeof pmRef === 'object') {
                        pm = pmRef
                    } else if (typeof pmRef === 'string') {
                        pm = await stripe.paymentMethods.retrieve(pmRef)
                    }
                } else if (typeof paymentIntent === 'string') {
                    const pi = await stripe.paymentIntents.retrieve(paymentIntent, {
                        expand: ['payment_method'],
                    }) as any
                    pm = pi.payment_method
                }

                if (pm?.type === 'card' && pm.card) {
                    const brand = pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)
                    paymentMethod = `${brand} •••• ${pm.card.last4}`
                } else if (pm?.type) {
                    paymentMethod = pm.type
                }
            }

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
                    amount,
                    currency,
                    billing_cycle: interval,
                    payment_method: paymentMethod,
                    status: subscription.status === 'active' ? 'active' : subscription.status,
                    next_billing: currentPeriodEnd,
                    start_date: currentPeriodStart,
                    trial_ends: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('tenant_id', tenantId)
            break
        }

        case 'customer.subscription.updated': {
            const subscription = stripeEvent.data.object as any
            const subscriptionId = subscription.id

            const firstItem = subscription.items?.data?.[0]
            const price = firstItem?.price
            const priceId = price?.id
            const amount = price?.unit_amount ? price.unit_amount / 100 : null
            const currency = price?.currency?.toUpperCase() || null
            const interval = price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

            const rawPeriodEnd = firstItem?.current_period_end
            const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null

            const updates: Record<string, any> = {
                status: subscription.status === 'active' ? 'active' : subscription.status,
                next_billing: currentPeriodEnd,
                stripe_price_id: priceId,
                amount,
                currency,
                billing_cycle: interval,
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