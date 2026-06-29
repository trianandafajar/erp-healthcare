import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type } = await readBody(event)

  if (!full_name) {
    throw createError({ statusCode: 400, message: 'Full name is required' })
  }

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await admin
    .from('patients')
    .insert({
      full_name,
      date_of_birth,
      gender,
      phone,
      address,
      blood_type
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
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
