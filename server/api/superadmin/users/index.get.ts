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
    const role = query.role as string | undefined
    const tenantId = query.tenant_id as string | undefined

    const admin = supabaseAdmin()

    let q = admin
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            status,
            created_at,
            updated_at,
            tenant_id,
            user_roles!inner (
                roles!inner (
                    name,
                    label
                )
            )
        `, { count: 'exact' })
        .neq('id', user.id)
        .returns<any[]>()

    if (search) {
        q = q.or(
            `full_name.ilike.%${search}%,` +
            `email.ilike.%${search}%`
        )
    }

    if (tenantId) {
        q = q.eq('tenant_id', tenantId)
    }

    if (role && role !== 'all') {
        q = q.eq('user_roles.roles.name', role)
    }

    let count: number | null = 0
    let profiles: any[]

    if (page) {
        const from = (page - 1) * limit
        const { data: paginatedData, error: paginatedError, count: totalCount } = await q.range(from, from + limit - 1)
        if (paginatedError) throw createError({ statusCode: 404, message: paginatedError.message })
        profiles = paginatedData ?? []
        count = totalCount
    } else {
        const { data: allData, error: allError, count: totalCount } = await q
        if (allError) throw createError({ statusCode: 404, message: allError.message })
        profiles = allData ?? []
        count = totalCount
    }

    const tenantIds = [...new Set(profiles.map(p => p.tenant_id).filter(Boolean))]
    let tenantMap: Record<string, { name: string; slug: string; owner_id: string | null }> = {}
    if (tenantIds.length > 0) {
        const { data: tenants } = await admin
            .from('tenants')
            .select('id, name, slug, owner_id')
            .in('id', tenantIds)
        if (tenants) {
            tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]))
        }
    }

    const result = profiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        tenant_id: p.tenant_id,
        tenant_name: p.tenant_id ? tenantMap[p.tenant_id]?.name ?? null : null,
        tenant_slug: p.tenant_id ? tenantMap[p.tenant_id]?.slug ?? null : null,
        is_owner: p.tenant_id ? tenantMap[p.tenant_id]?.owner_id === p.id : false,
        role: p.user_roles?.[0]?.roles?.name ?? null,
        role_label: p.user_roles?.[0]?.roles?.label ?? null,
    }))

    return {
        profiles: result,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})