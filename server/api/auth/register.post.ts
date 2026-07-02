export default defineEventHandler(async (event) => {
    const { email, password, full_name, tenant_name } = await readBody(event)

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

    return { user: data.user }
})
