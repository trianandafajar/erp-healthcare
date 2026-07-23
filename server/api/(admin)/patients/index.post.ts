import { getTenantContext } from '~~/server/utils/getTenantContext'
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event: any) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type, email, description, length_of_stay } = await readBody(event)

  if (!full_name) {
    throw createError({ statusCode: 400, message: 'Full name is required' })
  }

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data, error } = await admin
    .from('patients')
    .insert({
      full_name,
      date_of_birth,
      gender,
      phone,
      address,
      blood_type,
      tenant_id: tenantId
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  if (email || description || length_of_stay) {
    const { error: admissionError } = await admin
      .from('patient_admissions')
      .insert({
        patient_id: data.id,
        email: email || null,
        description: description || null,
        length_of_stay: length_of_stay || null,
        tenant_id: tenantId
      })

    if (admissionError) throw createError({ statusCode: 400, message: admissionError.message })
  }

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_tenant_id: tenantId,
    p_action: 'create',
    p_module: 'patients',
    p_entity_id: data.id,
    p_description: `Created patient ${data.full_name} (${data.medical_record_number ?? '-'})`,
    p_metadata: { after: data }
  })

  const recipientIds = await getRecipientIdsByRoles(admin, ['doctor', 'specialist', 'admin', 'receptionist'], user?.id)
  await insertNotifications(
    admin,
    [
      ...(user?.id
        ? [{
          user_id: user.id,
          type: 'patient_created',
          title: 'New patient registered',
          body: `${data.full_name} has been added to the system.`,
          data: {
            entity_type: 'patient',
            entity_id: data.id,
            medical_record_number: data.medical_record_number ?? null,
            created_by: user?.id ?? null,
          },
        }]
        : []),
      ...recipientIds.map(user_id => ({
        user_id,
        type: 'patient_created',
        title: 'New patient registered',
        body: `${data.full_name} has been added to the system.`,
        data: {
          entity_type: 'patient',
          entity_id: data.id,
          medical_record_number: data.medical_record_number ?? null,
          created_by: user?.id ?? null,
        },
      })),
    ],
  )

  return { patient: data }
})
