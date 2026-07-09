export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const query = getQuery(event)
    const page = query.page ? Number(query.page) : undefined
    const limit = Number(query.limit ?? 10)
    const search = query.search as string | undefined

    let q = admin
        .from('landingpage_industries')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })

    if (search) {
        q = q.ilike('title', `%${search}%`)
    }

    if (page) {
        const from = (page - 1) * limit
        q = q.range(from, from + limit - 1)
    }

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 400, message: error.message })
    return {
        industries: data,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})
