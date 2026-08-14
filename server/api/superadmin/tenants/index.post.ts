export default withSuperadmin(async (event) => {
    const body = await readBody(event)
    const { tenant_name, admin_email, admin_password, admin_full_name, subscription_plan, billing_cycle } = body

    if (!tenant_name) throw createError({ statusCode: 400, message: 'Tenant name is required' })
    if (!admin_email) throw createError({ statusCode: 400, message: 'Admin email is required' })
    if (!admin_password) throw createError({ statusCode: 400, message: 'Admin password is required' })
    if (!admin_full_name) throw createError({ statusCode: 400, message: 'Admin full name is required' })

    const validPlans = ['free', 'basic', 'pro', 'enterprise']
    if (subscription_plan && !validPlans.includes(subscription_plan)) {
        throw createError({ statusCode: 400, message: `Invalid plan: ${subscription_plan}` })
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
        .insert({ name: tenant_name, slug })
        .select('id, name, slug')
        .single()

    if (tenantErr || !tenant) {
        throw createError({ statusCode: 500, message: tenantErr?.message || 'Failed to create tenant' })
    }

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: admin_email,
        password: admin_password,
        user_metadata: { full_name: admin_full_name, role: 'admin' },
        email_confirm: true,
    })

    if (authErr || !authData.user) {
        await admin.from('tenants').delete().eq('id', tenant.id)
        throw createError({ statusCode: 500, message: authErr?.message || 'Failed to create admin user' })
    }

    const profileErr = await admin
        .from('profiles')
        .update({ tenant_id: tenant.id })
        .eq('id', authData.user.id)

    if (profileErr.error) {
        await admin.from('tenants').delete().eq('id', tenant.id)
        await admin.auth.admin.deleteUser(authData.user.id)
        throw createError({ statusCode: 500, message: profileErr.error.message })
    }

    if (subscription_plan) {
        const { error: subErr } = await admin
            .from('tenant_subscriptions')
            .insert({
                tenant_id: tenant.id,
                plan: subscription_plan,
                status: 'active',
                billing_cycle: billing_cycle || 'monthly',
            })

        if (subErr) {
            await admin.from('tenants').delete().eq('id', tenant.id)
            await admin.auth.admin.deleteUser(authData.user.id)
            throw createError({ statusCode: 500, message: subErr.message })
        }
    }

    return {
        tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
        },
        admin: {
            id: authData.user.id,
            email: admin_email,
        },
    }
})
