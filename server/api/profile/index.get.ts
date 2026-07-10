export default defineEventHandler(async (event) => {
  const supabase = serverSupabase(event)

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw createError({
      statusCode: 404,
      message: 'Profile not found',
    })
  }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      roles(
        id,
        name,
        label,
        role_permissions(
          permissions(
            name
          )
        )
      )
    `)
    .eq('user_id', user.id)

  const roles = userRoles?.map((r: any) => r.roles).filter(Boolean) ?? []

  let tenant = null
  let subscription = null
  let settings = null
  if (profile?.tenant_id) {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id, name, slug, subscription_plan, subscription_status, brand_color')
      .eq('id', profile.tenant_id)
      .single()
    tenant = tenantData

    const { data: subData } = await supabase
      .from('tenant_subscriptions')
      .select('plan, status, billing_cycle, amount, currency, next_billing, trial_ends, start_date, stripe_customer_id')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle()
    subscription = subData

    const { data: settingsData } = await supabase
      .from('tenant_settings')
      .select('display_name, logo_url')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle()
    settings = settingsData
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    roles,
    tenant,
    subscription,
    settings,
  }
})
