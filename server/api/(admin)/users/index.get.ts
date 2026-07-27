import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)
    const query = getQuery(event)
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)
    const search = query.search as string | undefined
    const role = query.role as string | undefined

    let q = admin
        .from('profiles')
        .select(`
        id,
        full_name,
        email,
        status,
        created_at,
        updated_at,
        user_roles (
            roles (
                name,
                label
            )
        )
    `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .neq('id', user?.id)
        .returns<any[]>()

    if (search) {
        q = q.or(
            `full_name.ilike.%${search}%,` +
            `email.ilike.%${search}%`
        )
    }

    if (role && role !== 'all') {
        q = q.eq('user_roles.roles.name', role)
    }

    const from = (page - 1) * limit
    q = q.range(from, from + limit - 1)

    const { data: profiles, error, count } = await q

    if (error) {
        throw createError({ statusCode: 404, message: error.message })
    }

    const { data: tenant } = await admin
        .from('tenants')
        .select('owner_id')
        .eq('id', tenantId)
        .single()
        .returns<{ owner_id: string | null }>()

    const ownerId = tenant?.owner_id ?? null

    const filtered = (profiles ?? []).filter(
        p => p.user_roles?.[0]?.roles?.name !== 'admin'
    )

    const result = filtered.map(p => ({
        ...p,
        role: p.user_roles?.[0]?.roles?.name ?? null,
        role_label: p.user_roles?.[0]?.roles?.label ?? null,
        is_owner: p.id === ownerId,
        user_roles: undefined,
    }))

    return {
        profiles: result,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
    }
})