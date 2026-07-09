export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = query.page ? Number(query.page) : undefined
    const limit = Number(query.limit ?? 10)

    let q = supabaseAdmin()
        .from('landingpage_logos')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })

    if (page) {
        const from = (page - 1) * limit
        q = q.range(from, from + limit - 1)
    }

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 500, message: error.message })
    return {
        logos: data,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})
