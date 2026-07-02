import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
  const { admin, tenantId } = await getTenantContext(event)

  const { data, error } = await admin
    .from('departments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { departments: data }
})