import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event: any) => {
  const { id, full_name, date_of_birth, gender, phone, address, blood_type } = await readBody(event)

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
    .update({ full_name, date_of_birth, gender, phone, address, blood_type })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'update',
    p_module: 'patients',
    p_entity_id: id,
    p_description: `Updated patient ${full_name ?? before?.full_name} (${before?.medical_record_number ?? '-'})`,
    p_metadata: {
      before: before ?? null,
      after: { full_name, date_of_birth, gender, phone, address, blood_type }
    }
  })

  return { message: 'Patient updated successfully' }
})