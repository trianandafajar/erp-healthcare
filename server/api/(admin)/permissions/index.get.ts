export default defineEventHandler(async (event: any) => {
    const admin = supabaseAdmin()
    const query = getQuery(event)
    const page = query.page ? Number(query.page) : undefined
    const limit = Number(query.limit ?? 10)

    let q = admin
        .from('permissions')
        .select('id, name, label, module, category, created_at', { count: 'exact' })
        .order('module', { ascending: true })

    if (page) {
        const from = (page - 1) * limit
        q = q.range(from, from + limit - 1)
    }

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 400, message: error.message })

    const grouped = (data ?? []).reduce((acc: Record<string, any[]>, perm) => {
        const mod = perm.module ?? 'uncategorized'
        if (!acc[mod]) acc[mod] = []
        acc[mod].push(perm)
        return acc
    }, {})

    const groupedByCategory = (data ?? []).reduce((acc: Record<string, any[]>, perm) => {
        const cat = perm.category ?? 'uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(perm)
        return acc
    }, {})

    return {
        permissions: data ?? [],
        grouped,
        groupedByCategory,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
    }
}) 