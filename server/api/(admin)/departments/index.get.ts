import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
  const { admin, tenantId } = await getTenantContext(event)
  const query = getQuery(event)
  const page = query.page ? Number(query.page) : undefined
  const limit = Number(query.limit ?? 10)
  const search = query.search as string | undefined

  let q = admin
    .from('departments')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('name')

  if (search) {
    q = q.or(
      `name.ilike.%${search}%,` +
      `code.ilike.%${search}%`
    )
  }

  if (page) {
    const from = (page - 1) * limit
    q = q.range(from, from + limit - 1)
  }

  const { data, error, count } = await q

  if (error) throw createError({ statusCode: 400, message: error.message })

  return {
    departments: data,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
})