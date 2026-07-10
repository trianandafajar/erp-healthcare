import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const query = getQuery(event)

    const module = query.module as string | undefined
    const action = query.action as string | undefined
    const search = query.search as string | undefined
    const fromDate = query.from as string | undefined
    const toDate = query.to as string | undefined
    const actorId = query.actor_id as string | undefined

    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)

    const { admin } = await getTenantContext(event)

    let q = admin
        .from('activity_logs')
        .select(`
            id,
            action,
            module,
            entity_id,
            description,
            created_at,
            profiles:profiles (
                full_name,
                email
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

    if (module && module !== 'all') {
        q = q.eq('module', module)
    }

    if (action && action !== 'all') {
        q = q.eq('action', action)
    }

    if (search) {
        q = q.or(
            `description.ilike.%${search}%,` +
            `profiles.full_name.ilike.%${search}%`
        )
    }

    if (fromDate) {
        q = q.gte('created_at', new Date(fromDate).toISOString())
    }

    if (toDate) {
        q = q.lte('created_at', new Date(toDate).toISOString())
    }

    if (actorId) {
        q = q.eq('actor_id', actorId)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    q = q.range(from, to)

    const { data, error, count } = await q

    if (error) {
        throw createError({
            statusCode: 400,
            message: error.message,
        })
    }

    const result = (data ?? []).map((log: any) => ({
        id: log.id,
        action: log.action,
        module: log.module,
        entity_id: log.entity_id,
        description: log.description,
        created_at: log.created_at,
        actor_name: log.profiles?.full_name ?? 'System',
        actor_email: log.profiles?.email ?? null,
    }))

    return {
        logs: result,
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
    }
})