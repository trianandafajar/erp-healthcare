export default defineEventHandler(async (event) => {
  const {
    doctor_id,
    appointment_date,
    appointment_time,
    type,
    status,
    chief_complaint,
    notes,
    department_id,
  } = await readBody(event)

  if (!doctor_id) {
    throw createError({ statusCode: 400, message: 'doctor_id is required' })
  }
  if (!appointment_date) {
    throw createError({ statusCode: 400, message: 'appointment_date is required' })
  }
  if (!appointment_time) {
    throw createError({ statusCode: 400, message: 'appointment_time is required' })
  }
  if (!type) {
    throw createError({ statusCode: 400, message: 'type is required' })
  }
  if (!status) {
    throw createError({ statusCode: 400, message: 'status is required' })
  }

  const supabase = serverSupabase(event)
  const admin = supabaseAdmin()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const {
    data: patient,
    error: patientError,
  } = await admin
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single()
    .returns<{ id: string }>()

  if (patientError || !patient) {
    throw createError({ statusCode: 404, message: 'Patient profile not found' })
  }

  const { data: appointment, error: insertError } = await admin
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id,
      department_id: department_id ?? null,
      appointment_date,
      appointment_time,
      type,
      status,
      chief_complaint,
      notes,
    })
    .select()
    .single()

  if (insertError) {
    throw createError({ statusCode: 400, message: insertError.message })
  }

  return {
    appointment,
  }
})



