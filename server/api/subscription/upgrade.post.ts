export default defineEventHandler(async (event) => {
  const { plan_name, billing_cycle } = await readBody(event)

  if (!plan_name) {
    throw createError({ statusCode: 400, message: 'Plan name is required' })
  }

  const validPlans = ['starter', 'basic', 'professional', 'enterprise']
  if (!validPlans.includes(plan_name)) {
    throw createError({ statusCode: 400, message: `Invalid plan: ${plan_name}` })
  }

  const supabase = serverSupabase(event)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    throw createError({ statusCode: 400, message: 'No tenant found' })
  }

  const admin = supabaseAdmin()

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name, slug, subscription_plan, subscription_status')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  if (tenant.subscription_plan === plan_name) {
    throw createError({ statusCode: 400, message: `Already on the ${plan_name} plan` })
  }

  const { data: currentSub } = await admin
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  const { data: pricingPlan } = await admin
    .from('pricing_plans')
    .select('id, title, stripe_price_id, stripe_price_id_yearly')
    .ilike('title', plan_name)
    .maybeSingle()

  if (!pricingPlan) {
    throw createError({ statusCode: 404, message: 'Pricing plan not found' })
  }

  const cycle = billing_cycle || currentSub?.billing_cycle || 'monthly'
  const newPriceId = cycle === 'yearly' ? pricingPlan.stripe_price_id_yearly : pricingPlan.stripe_price_id

  const origin = getRequestURL(event).origin

  if (currentSub?.stripe_subscription_id && newPriceId) {
    await stripe.subscriptions.cancel(currentSub.stripe_subscription_id, {
      invoice_now: true,
      prorate: true,
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: newPriceId, quantity: 1 }],
      client_reference_id: tenant.id,
      customer_email: user.email,
      metadata: {
        tenant_id: tenant.id,
        upgrade: 'true',
      },
      success_url: `${origin}/${tenant.slug}/settings?upgrade=success`,
      cancel_url: `${origin}/${tenant.slug}/settings?upgrade=canceled`,
    })

    return { url: session.url, requires_payment: true }
  }

  if (newPriceId) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: newPriceId, quantity: 1 }],
      client_reference_id: tenant.id,
      customer_email: user.email,
      metadata: {
        tenant_id: tenant.id,
        upgrade: 'true',
      },
      success_url: `${origin}/${tenant.slug}/settings?upgrade=success`,
      cancel_url: `${origin}/${tenant.slug}/settings?upgrade=canceled`,
    })

    return { url: session.url, requires_payment: true }
  }

  await admin
    .from('tenant_subscriptions')
    .update({
      plan: plan_name,
      status: 'active',
      billing_cycle: cycle,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenant.id)

  return { success: true, requires_payment: false }
})
