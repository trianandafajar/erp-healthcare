export default defineEventHandler(async (event) => {
    const { email, password, full_name, tenant_name, pricing_plan_id } = await readBody(event)

    if (!email || !password || !full_name || !tenant_name) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, full name, and tenant name are required.',
        })
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

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name, role: 'admin', tenant_name, tenant_slug: slug },
        email_confirm: true,
    })

    if (error) throw createError({ statusCode: 401, message: error.message })

    const { data: profile } = await admin
        .from('profiles')
        .select('tenant_id')
        .eq('id', data.user.id)
        .single()

    return {
        user: data.user,
        tenant_id: profile?.tenant_id || null,
        pricing_plan_id: pricing_plan_id || null,
    }
})
