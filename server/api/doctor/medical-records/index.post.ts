export default defineEventHandler(async (event) => {
  const {
    appointment_id,
    patient_id,

    blood_pressure,
    temperature,
    heart_rate,
    weight,
    height,

    subjective,
    objective,
    treatment_plan,

    diagnosis,
    icd10_code,
    notes,

    prescriptions
  } = await readBody(event)

  if (!appointment_id || !patient_id || !diagnosis) {
    throw createError({
      statusCode: 400,
      message: 'appointment_id, patient_id and diagnosis are required'
    })
  }

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { data: doctor, error: doctorError } = await admin
    .from('doctors')
    .select('id')
    .eq('id', user.id)
    .single()

  if (doctorError || !doctor) {
    throw createError({ statusCode: 404, message: 'Doctor profile not found' })
  }

  const { data: medicalRecord, error: medicalRecordError } = await admin
    .from('medical_records')
    .insert({
      appointment_id,
      patient_id,
      doctor_id: doctor.id,

      blood_pressure,
      temperature,
      heart_rate,
      weight,
      height,

      subjective,
      objective,
      treatment_plan,

      diagnosis,
      icd10_code,
      notes
    })
    .select()
    .single()

  if (medicalRecordError) {
    throw createError({ statusCode: 400, message: medicalRecordError.message })
  }

  if (Array.isArray(prescriptions) && prescriptions.length > 0) {
    const prescriptionRows = prescriptions.map((item: any) => ({
      medical_record_id: medicalRecord.id,
      patient_id,
      doctor_id: doctor.id,
      medication_name: item.medication_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions
    }))

    const { error: prescriptionError } = await admin
      .from('prescriptions')
      .insert(prescriptionRows)

    if (prescriptionError) {
      throw createError({ statusCode: 400, message: prescriptionError.message })
    }
  }

  await admin
    .from('appointments')
    .update({ status: 'done' })
    .eq('id', appointment_id)

  await admin.rpc('log_activity', {
    p_actor_id: user.id,
    p_action: 'create',
    p_module: 'medical_records',
    p_entity_id: medicalRecord.id,
    p_description: `Created medical record for patient ${patient_id}`,
    p_metadata: { medical_record_id: medicalRecord.id, appointment_id }
  })

  return {
    medical_record: medicalRecord,
    message: 'Medical record created successfully'
  }
})