export default defineEventHandler(async (event) => {
  const { tenant_name, plan_name, billing_cycle } = await readBody(event)

  if (!tenant_name) {
    throw createError({ statusCode: 400, message: 'Tenant name is required' })
  }

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

  const admin = supabaseAdmin()

  let slug = tenant_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { count } = await admin
    .from('tenants')
    .select('slug', { count: 'exact', head: true })
    .filter('slug', 'like', `${slug}%`)

  if (count && count > 0) {
    slug = `${slug}-${count}`
  }

  const { data: tenant, error: tenantErr } = await admin
    .from('tenants')
    .insert({
      name: tenant_name,
      slug,
    })
    .select('id')
    .single()

  if (tenantErr || !tenant) {
    throw createError({ statusCode: 500, message: tenantErr?.message || 'Failed to create tenant' })
  }

  const { data: pricingPlan } = await admin
    .from('pricing_plans')
    .select('id, title, stripe_price_id, stripe_price_id_yearly')
    .ilike('title', plan_name)
    .maybeSingle()

  const hasStripePrice = pricingPlan?.stripe_price_id

  if (hasStripePrice) {
    const priceId = billing_cycle === 'yearly' && pricingPlan.stripe_price_id_yearly
      ? pricingPlan.stripe_price_id_yearly
      : pricingPlan.stripe_price_id

    await admin
      .from('tenant_subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan: plan_name,
        status: 'pending',
        billing_cycle: billing_cycle || 'monthly',
      })

    const origin = getRequestURL(event).origin
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: tenant.id,
      success_url: `${origin}/${slug}/configure?checkout=success`,
      cancel_url: `${origin}/onboarding/subscription?canceled=true`,
    })

    return { url: session.url, slug, requires_payment: true }
  }

  await admin
    .from('tenant_subscriptions')
    .insert({
      tenant_id: tenant.id,
      plan: plan_name,
      status: 'active',
      billing_cycle: billing_cycle || 'monthly',
    })

  return { slug, success: true, requires_payment: false }
})
