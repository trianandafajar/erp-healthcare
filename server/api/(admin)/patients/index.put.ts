import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event: any) => {
  const { id, full_name, date_of_birth, gender, phone, address, blood_type, room, email, description, length_of_stay } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Patient ID is required' })

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data: before } = await admin
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  const updateData: Record<string, any> = { full_name, date_of_birth, gender, phone, address, blood_type }
  if (room !== undefined) updateData.room = room

  const { error } = await admin
    .from('patients')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 400, message: error.message })

  const admissionData: Record<string, any> = {}
  if (email !== undefined) admissionData.email = email
  if (description !== undefined) admissionData.description = description
  if (length_of_stay !== undefined) admissionData.length_of_stay = length_of_stay

  if (Object.keys(admissionData).length > 0) {
    const { data: existing } = await admin
      .from('patient_admissions')
      .select('id')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      await admin
        .from('patient_admissions')
        .update(admissionData)
        .eq('id', existing.id)
    } else {
      await admin
        .from('patient_admissions')
        .insert({ patient_id: id, ...admissionData, tenant_id: tenantId })
    }
  }

  if (email && before?.profile_id) {
    await admin.from('profiles').update({ email }).eq('id', before.profile_id)
  }

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_tenant_id: tenantId,
    p_action: 'update',
    p_module: 'patients',
    p_entity_id: id,
    p_description: `Updated patient ${full_name ?? before?.full_name} (${before?.medical_record_number ?? '-'})`,
    p_metadata: {
      before: before ?? null,
      after: { full_name, date_of_birth, gender, phone, address, blood_type, room, email, description, length_of_stay }
    }
  })

  return { message: 'Patient updated successfully' }
})
