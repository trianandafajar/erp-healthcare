import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const query = getQuery(event)
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)
    const search = query.search as string | undefined
    const department = query.department as string | undefined
    const available = query.available as string | undefined

    let q = admin
        .from('nurses')
        .select(`
            id,
            phone,
            experience_years,
            is_available,
            created_at,
            updated_at,
            profiles (  
                full_name,
                email,
                status,
                avatar_url
            ),
            departments (
                id,
                name,
                code
            )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (search) {
        q = q.or(
            `profiles.full_name.ilike.%${search}%,` +
            `profiles.email.ilike.%${search}%`
        )
    }

    if (department) {
        q = q.eq('departments.id', department)
    }

    if (available === 'true') {
        q = q.eq('is_available', true)
    } else if (available === 'false') {
        q = q.eq('is_available', false)
    }

    const from = (page - 1) * limit
    q = q.range(from, from + limit - 1)

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = (data ?? []).map(d => ({
        ...d,
        full_name: d.profiles?.full_name ?? null,
        email: d.profiles?.email ?? null,
        status: d.profiles?.status ?? null,
        photo_url: d.profiles?.avatar_url ?? null,
        department: d.departments,
        profiles: undefined,
        departments: undefined
    }))

    return {
        nurses: result,
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
    }
})