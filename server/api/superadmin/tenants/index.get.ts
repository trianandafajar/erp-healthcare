export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const query = getQuery(event)
    const page = query.page ? Number(query.page) : undefined
    const limit = Number(query.limit ?? 10)
    const search = query.search as string | undefined
    const plan = query.plan as string | undefined
    const admin = supabaseAdmin()

    let q = admin
        .from('tenants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (search) {
        q = q.or(
            `name.ilike.%${search}%,` +
            `slug.ilike.%${search}%`
        )
    }

    if (plan && plan !== 'All') {
        q = q.eq('subscription_plan', plan)
    }

    let count: number | null = 0
    let tenants: any[]

    if (page) {
        const from = (page - 1) * limit
        const { data: paginatedData, error: paginatedError, count: totalCount } = await q.range(from, from + limit - 1)
        if (paginatedError) throw createError({ statusCode: 500, message: paginatedError.message })
        tenants = paginatedData ?? []
        count = totalCount
    } else {
        const { data: allData, error: allError, count: totalCount } = await q
        if (allError) throw createError({ statusCode: 500, message: allError.message })
        tenants = allData ?? []
        count = totalCount
    }

    const tenantIds = tenants.map((t) => t.id)
    const ownerIds = [...new Set(tenants.map((t) => t.owner_id).filter(Boolean))]

    let profilesMap: Record<string, any> = {}
    if (ownerIds.length > 0) {
        const { data: profiles, error: profileError } = await admin
            .from('profiles')
            .select('id, email, full_name')
            .in('id', ownerIds)

        if (profileError) throw createError({ statusCode: 500, message: profileError.message })

        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    }

    let userCountMap: Record<string, number> = {}
    if (tenantIds.length > 0) {
        const { data: allProfiles, error: countError } = await admin
            .from('profiles')
            .select('tenant_id')
            .in('tenant_id', tenantIds)

        if (countError) throw createError({ statusCode: 500, message: countError.message })

        userCountMap = allProfiles.reduce((acc: Record<string, number>, p) => {
            if (p.tenant_id) {
                acc[p.tenant_id] = (acc[p.tenant_id] ?? 0) + 1
            }
            return acc
        }, {})
    }

    const tenantsWithDetails = tenants.map((t) => ({
        ...t,
        owner: t.owner_id ? profilesMap[t.owner_id] ?? null : null,
        total_users: userCountMap[t.id] ?? 0,
    }))

    return {
        tenants: tenantsWithDetails,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})