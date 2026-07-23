import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event: any) => {
  const { id } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Patient ID is required' })

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data: before } = await admin
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await admin
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_tenant_id: tenantId,
    p_action: 'delete',
    p_module: 'patients',
    p_entity_id: id,
    p_description: `Deleted patient ${before?.full_name ?? '-'} (${before?.medical_record_number ?? '-'})`,
    p_metadata: { before: before ?? null }
  })

  return { message: 'Patient deleted successfully' }
})