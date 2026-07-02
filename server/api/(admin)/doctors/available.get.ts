import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
  const { admin, tenantId } = await getTenantContext(event)

  const { data: userRoles, error: roleError } = await admin
    .from('user_roles')
    .select('user_id, roles!inner(name), profiles!inner(tenant_id)')
    .eq('roles.name', 'doctor')
    .eq('profiles.tenant_id', tenantId)
    .returns<any[]>()

  if (roleError)
    throw createError({ statusCode: 400, message: roleError.message })

  const userIds = userRoles.map(ur => ur.user_id)

  if (userIds.length === 0) return { users: [] }

  const { data: existingDoctors, error: doctorError } = await admin
    .from('doctors')
    .select('id')
    .in('id', userIds)

  if (doctorError)
    throw createError({ statusCode: 400, message: doctorError.message })

  const existingIds = new Set((existingDoctors ?? []).map(d => d.id))
  const availableIds = userIds.filter(id => !existingIds.has(id))

  if (availableIds.length === 0) return { users: [] }

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', availableIds)

  if (profileError)
    throw createError({ statusCode: 400, message: profileError.message })

  return { users: profiles }
})