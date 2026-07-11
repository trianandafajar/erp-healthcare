export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const query = getQuery(event)
    const page = query.page ? Number(query.page) : undefined
    const limit = Number(query.limit ?? 10)
    const search = query.search ? String(query.search).trim() : undefined
    const plan = query.plan ? String(query.plan) : undefined
    const status = query.status ? String(query.status) : undefined

    const admin = supabaseAdmin()

    let q = admin
        .from('tenant_subscriptions')
        .select('*, tenant:tenants!inner(name, slug, owner_id)', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (plan) {
        q = q.eq('plan', plan)
    }

    if (status) {
        q = q.eq('status', status)
    }

    if (search) {
        q = q.ilike('tenant.name', `%${search}%`)
    }

    if (page) {
        const from = (page - 1) * limit
        q = q.range(from, from + limit - 1)
    }

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 500, message: error.message })

    return {
        subscriptions: data,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})