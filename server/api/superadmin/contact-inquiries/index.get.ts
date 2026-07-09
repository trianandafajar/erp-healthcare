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
    const search = query.search as string | undefined
    const admin = supabaseAdmin()

    let q = admin
        .from('contact_inquiries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (search) {
        q = q.or(
            `name.ilike.%${search}%,` +
            `email.ilike.%${search}%,` +
            `subject.ilike.%${search}%,` +
            `message.ilike.%${search}%`
        )
    }

    if (page) {
        const from = (page - 1) * limit
        q = q.range(from, from + limit - 1)
    }

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 500, message: error.message })

    return {
        inquiries: data,
        total: count ?? 0,
        page: page ?? 1,
        limit,
        totalPages: page ? Math.ceil((count ?? 0) / limit) : 1,
    }
})
