import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event) => {
  const body = await readBodyObject(event)
  const id = body?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Appointment ID is required',
    })
  }

  checkFormat(isUUID(id), 'ID', 'UUID')

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data: before } = await admin
    .from('appointments')
    .select(`
      *,
      patients (
        full_name,
        medical_record_number
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await admin
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'delete',
    p_module: 'appointments',
    p_entity_id: id,
    p_description: `Removed appointment for ${(before as any)?.patients?.full_name ?? 'a patient'}`,
    p_metadata: {
      before: before ?? null,
    },
  })

  return {
    message: 'Appointment removed successfully',
  }
})