import { getTenantContext } from "~~/server/utils/getTenantContext"
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event: any) => {
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

  checkFormat(isUUID(appointment_id), 'appointment_id', 'UUID')
  checkFormat(isUUID(patient_id), 'patient_id', 'UUID')

  const { admin, tenantId, user } = await getTenantContext(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { data: doctor, error: doctorError } = await admin
    .from('doctors')
    .select('id')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
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
      tenant_id: tenantId,

      blood_pressure,
      temperature: toFiniteNumber(temperature),
      heart_rate: toFiniteNumber(heart_rate),
      weight: toFiniteNumber(weight),
      height: toFiniteNumber(height),

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
    const medicineIds = prescriptions
      .map((p: any) => p.medicine_id)
      .filter(Boolean)

    const { data: medicineList } = await admin
      .from('medicine_stocks')
      .select('id, medicine_name')
      .in('id', medicineIds)

    const medicineMap = Object.fromEntries(
      (medicineList ?? []).map((m: any) => [m.id, m.medicine_name])
    )

    const prescriptionRows = prescriptions.map((item: any) => ({
      medical_record_id: medicalRecord.id,
      patient_id,
      doctor_id: doctor.id,
      medication_name: medicineMap[item.medicine_id] ?? '',
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
      tenant_id: tenantId
    }))

    const { error: prescriptionError } = await admin
      .from('prescriptions')
      .insert(prescriptionRows)

    if (prescriptionError) {
      throw createError({ statusCode: 400, message: prescriptionError.message })
    }

    const recipientIds = await getRecipientIdsByRoles(admin, ['pharmacy', 'admin'])
    await insertNotifications(
      admin,
      prescriptionRows.flatMap((item) =>
        recipientIds.map(user_id => ({
          user_id,
          type: 'prescription_new',
          title: 'New prescription received',
          body: `${item.medication_name} has been sent to pharmacy.`,
          data: {
            entity_type: 'medical_record',
            entity_id: medicalRecord.id,
            patient_id,
            doctor_id: doctor.id,
            medication_name: item.medication_name,
            level: 'warning',
            audience_role: 'pharmacy',
            redirect_to: '/pharmacy/prescriptions',
          },
        })),
      ),
    )
  }
  await admin
    .from('appointments')
    .update({ status: 'done' })
    .eq('id', appointment_id)
    .eq('tenant_id', tenantId)

  await admin.rpc('log_activity', {
    p_actor_id: user.id,
    p_tenant_id: tenantId,
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
