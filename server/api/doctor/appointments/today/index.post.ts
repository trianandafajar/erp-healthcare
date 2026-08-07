export default defineEventHandler(async (event) => {
  const {
    appointment_date,
    appointment_time,
    type,
    status,
    chief_complaint,
    notes,
    patient_id,
  } = await readBody(event)

  if (
    !appointment_date ||
    !appointment_time ||
    !type ||
    !status ||
    !patient_id
  ) {
    throw createError({
      statusCode: 400,
      message:
        'appointment_date, appointment_time, type, status, and patient_id are required',
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

  const { data: appointment, error } = await admin
    .from('appointments')
    .insert({
      patient_id,
      appointment_date,
      appointment_time,
      type,
      status,
      chief_complaint,
      notes,
      doctor_id: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'This time slot is already booked',
      })
    }
    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }

  const { data, error: fetchError } = await admin
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      type,
      status,
      chief_complaint,
      notes,
      created_at,
      updated_at,
      patients (
        full_name,
        medical_record_number
      )
    `)
    .eq('id', appointment.id)
    .single()

  if (fetchError) {
    throw createError({
      statusCode: 400,
      message: fetchError.message,
    })
  }

  await admin.rpc('log_activity', {
    p_actor_id: user.id,
    p_action: 'create',
    p_module: 'appointments',
    p_entity_id: appointment.id,
    p_description: `Appointment created for ${appointment.appointment_date} at ${appointment.appointment_time}`,
    p_metadata: {
      after: data,
    },
  })

  return {
    appointment: data,
  }
})