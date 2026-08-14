import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event) => {
  const body = await readBodyObject(event)
  const id = body?.id

  if (!id) throw createError({ statusCode: 400, message: 'Doctor ID is required' })
  checkFormat(isUUID(id), 'ID', 'UUID')

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data: before } = await admin
    .from('doctors')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await admin
    .from('doctors')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'delete',
    p_module: 'doctors',
    p_entity_id: id,
    p_description: `Removed doctor profile for ${(before as any)?.profiles?.full_name ?? 'a doctor'}`,
    p_metadata: { before: before ?? null }
  })

  return { message: 'Doctor profile removed successfully' }
})