export default defineEventHandler(async (event) => {
  const {
    id,
    appointment_date,
    appointment_time,
    type,
    status,
    chief_complaint,
    notes,
    patient_id,
  } = await readBody(event)

  if (
    !id ||
    !appointment_date ||
    !appointment_time ||
    !type ||
    !status ||
    !patient_id
  ) {
    throw createError({
      statusCode: 400,
      message:
        'id, appointment_date, appointment_time, type, status, and patient_id are required',
    })
  }

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const { data: before, error: beforeError } = await admin
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single()

  if (beforeError) {
    throw createError({
      statusCode: 404,
      message: 'Appointment not found',
    })
  }

  const { data, error } = await admin
    .from('appointments')
    .update({
      appointment_date,
      appointment_time,
      type,
      status,
      chief_complaint,
      notes,
      patient_id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }

  await admin.rpc('log_activity', {
    p_actor_id: user.id,
    p_action: 'update',
    p_module: 'appointments',
    p_entity_id: data.id,
    p_description: `Appointment updated (${data.appointment_date} ${data.appointment_time})`,
    p_metadata: {
      before,
      after: data,
    },
  })

  return {
    appointment: data,
  }
})