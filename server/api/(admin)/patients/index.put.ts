import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event: any) => {
  const { id, full_name, date_of_birth, gender, phone, address, blood_type, email } = await readBody(event)

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

  if (email) {
    const { data: patient } = await admin
      .from('patients')
      .select('profile_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (patient?.profile_id) {
      await admin.from('profiles').update({ email }).eq('id', patient.profile_id)
    } else {
      const { data: latest } = await admin
        .from('patient_admissions')
        .select('id')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latest) {
        await admin.from('patient_admissions').update({ email }).eq('id', latest.id)
      }
    }
  }

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'update',
    p_module: 'patients',
    p_entity_id: id,
    p_description: `Updated patient ${full_name ?? before?.full_name} (${before?.medical_record_number ?? '-'})`,
    p_metadata: {
      before: before ?? null,
      after: { full_name, date_of_birth, gender, phone, address, blood_type, email }
    }
  })

  return { message: 'Patient updated successfully' }
})