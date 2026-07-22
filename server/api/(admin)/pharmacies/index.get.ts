import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)
    const query = getQuery(event)
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)
    const search = query.search as string | undefined

    let q = admin
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            status,
            created_at,
            user_roles!inner (
                roles!inner (
                    name
                )
            )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('user_roles.roles.name', 'pharmacy')
        .neq('id', user?.id)
        .returns<any[]>()

    if (search) {
        q = q.or(
            `full_name.ilike.%${search}%,` +
            `email.ilike.%${search}%`
        )
    }

    const from = (page - 1) * limit
    q = q.range(from, from + limit - 1)

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 400, message: error.message })

    return {
        pharmacists: data ?? [],
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
    }
})
