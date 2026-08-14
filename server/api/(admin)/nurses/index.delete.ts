import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event) => {
  const body = await readBodyObject(event)
  const id = body?.id

  if (!id) throw createError({ statusCode: 400, message: 'Nurse ID is required' })
  checkFormat(isUUID(id), 'ID', 'UUID')

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data: before } = await admin
    .from('nurses')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await admin
    .from('nurses')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'delete',
    p_module: 'nurses',
    p_entity_id: id,
    p_description: `Removed nurse profile for ${(before as any)?.profiles?.full_name ?? 'a nurse'}`,
    p_metadata: { before: before ?? null }
  })

  return { message: 'Nurse profile removed successfully' }
})