import { getTenantContext } from "~~/server/utils/getTenantContext"
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event: any) => {
    const { patient_id, doctor_id, department_id, appointment_date, appointment_time, type, chief_complaint, notes } = await readBody(event)

    if (!patient_id || !appointment_date) {
        throw createError({ statusCode: 400, message: 'Patient and date are required' })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data, error } = await admin
        .from('appointments')
        .insert({ patient_id, doctor_id, department_id, appointment_date, appointment_time, type, chief_complaint, notes, tenant_id: tenantId })
        .select()
        .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_tenant_id: tenantId,
    p_action: 'create',
    p_module: 'appointments',
    p_entity_id: data.id,
    p_description: `Created appointment for patient ${patient_id} on ${appointment_date}`,
    p_metadata: { after: data }
  })

  const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'], user?.id)
  const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'], user?.id)
  const notifications: {
    user_id: string
    type: string
    title: string
    body: string
    data: Record<string, any>
  }[] = []

  if (user?.id) {
    notifications.push({
      user_id: user.id,
      type: 'appointment_new',
      title: 'New appointment created',
      body: `Appointment for patient ${patient_id} on ${appointment_date} has been created.`,
      data: {
        entity_type: 'appointment',
        entity_id: data.id,
        patient_id,
        doctor_id: doctor_id ?? null,
        department_id: department_id ?? null,
        appointment_date,
        appointment_time: appointment_time ?? null,
        type: type ?? null,
      },
    })
  }

  if (doctor_id) {
    notifications.push({
      user_id: doctor_id,
      type: 'appointment_new',
      title: 'New appointment assigned',
      body: `You have a new patient appointment on ${appointment_date}.`,
      data: {
        entity_type: 'appointment',
        entity_id: data.id,
        patient_id,
        doctor_id,
        department_id: department_id ?? null,
        appointment_date,
        appointment_time: appointment_time ?? null,
        type: type ?? null,
      },
    })
  }

  notifications.push(
    ...receptionistRecipientIds.map((user_id) => ({
      user_id,
      type: 'appointment_new',
      title: 'New appointment created',
      body: `Appointment for patient ${patient_id} on ${appointment_date} has been created.`,
      data: {
        entity_type: 'appointment',
        entity_id: data.id,
        patient_id,
        doctor_id: doctor_id ?? null,
        department_id: department_id ?? null,
        appointment_date,
        appointment_time: appointment_time ?? null,
        type: type ?? null,
      },
    })),
  )

  notifications.push(
    ...adminRecipientIds.map((user_id) => ({
      user_id,
      type: 'appointment_new',
      title: 'New appointment created',
      body: `Appointment for patient ${patient_id} on ${appointment_date} has been created.`,
      data: {
        entity_type: 'appointment',
        entity_id: data.id,
        patient_id,
        doctor_id: doctor_id ?? null,
        department_id: department_id ?? null,
        appointment_date,
        appointment_time: appointment_time ?? null,
        type: type ?? null,
        audience_role: 'admin',
      },
    })),
  )

  await insertNotifications(admin, notifications)

  return { appointment: data }
})
