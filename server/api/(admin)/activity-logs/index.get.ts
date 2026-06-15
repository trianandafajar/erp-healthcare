export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const module = query.module as string | undefined
    const action = query.action as string | undefined
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 20)

    const admin = supabaseAdmin()

    let q = admin
        .from('activity_logs')
        .select(`
            id,
            action,
            module,
            entity_id,
            description,
            created_at,
            profiles (
                full_name,
                email
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

    if (module) q = q.eq('module', module)
    if (action) q = q.eq('action', action)

    const from = (page - 1) * limit
    const to = from + limit - 1
    q = q.range(from, to)

    const { data, error, count } = await q.returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map(log => ({
        id: log.id,
        action: log.action,
        module: log.module,
        entity_id: log.entity_id,
        description: log.description,
        created_at: log.created_at,
        actor_name: log.profiles?.full_name ?? 'System',
        actor_email: log.profiles?.email ?? null,
    }))

    return { logs: result, total: count ?? 0, page, limit }
})