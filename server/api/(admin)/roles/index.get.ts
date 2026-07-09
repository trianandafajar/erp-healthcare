export default defineEventHandler(async (event: any) => {
    const admin = supabaseAdmin()
    const query = getQuery(event)
    const page = query.page ? Number(query.page) : undefined
    const limit = Number(query.limit ?? 10)

    let q = admin
        .from('roles')
        .select(`
            id,
            name,
            label,
            created_at,
            role_permissions (
                permissions (
                    id,
                    name,
                    label,
                    module
                )
            ),
            user_roles (
                user_id
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: true })
        .returns<any[]>()

    if (page) {
        const from = (page - 1) * limit
        q = q.range(from, from + limit - 1)
    }

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = (data ?? []).map(r => ({
        id: r.id,
        name: r.name,
        label: r.label,
        created_at: r.created_at,
        permissions: r.role_permissions.map((rp: any) => rp.permissions),
        user_count: r.user_roles.length
    }))

    return {
        roles: result,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})