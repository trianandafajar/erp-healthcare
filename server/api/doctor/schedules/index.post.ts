import { getTenantContext } from "~~/server/utils/getTenantContext"
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event: any) => {
  const { day_of_week, start_time, end_time, max_patients, is_active } =
    await readBody(event)

  if (
    day_of_week === undefined ||
    !start_time ||
    !end_time ||
    max_patients === undefined
  ) {
    throw createError({ statusCode: 400, message: 'day_of_week, start_time, end_time, and max_patients are required' })
  }

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data, error } = await admin
    .from('doctor_schedules')
    .insert({
      doctor_id: user.id,
      day_of_week,
      start_time,
      end_time,
      max_patients,
      is_active: is_active ?? true,
      tenant_id: tenantId,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user.id,
    p_action: 'create',
    p_module: 'schedules',
    p_entity_id: data.id,
    p_description: `Schedule created for day ${data.day_of_week} (${start_time} - ${end_time})`,
    p_metadata: { after: data }
  })

  const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'], user.id)
  const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'], user.id)

  await insertNotifications(
    admin,
    [
      {
        user_id: user.id,
        type: 'schedule_created',
        title: 'New schedule created',
        body: `Your schedule for day ${data.day_of_week} has been created.`,
        data: {
          entity_type: 'doctor_schedule',
          entity_id: data.id,
          doctor_id: user.id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          level: 'info',
          audience_role: 'doctor',
          redirect_to: '/doctor/schedule',
        },
      },
      ...receptionistRecipientIds.map((user_id) => ({
        user_id,
        type: 'schedule_created',
        title: 'Doctor schedule updated',
        body: `A doctor schedule for day ${data.day_of_week} is now available.`,
        data: {
          entity_type: 'doctor_schedule',
          entity_id: data.id,
          doctor_id: user.id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          level: 'info',
          audience_role: 'receptionist',
          redirect_to: '/receptionist/doctor-schedules',
        },
      })),
      ...adminRecipientIds.map((user_id) => ({
        user_id,
        type: 'schedule_created',
        title: 'Doctor schedule updated',
        body: `A doctor schedule for day ${data.day_of_week} is now available.`,
        data: {
          entity_type: 'doctor_schedule',
          entity_id: data.id,
          doctor_id: user.id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          level: 'info',
          audience_role: 'admin',
        },
      })),
    ],
  )

  return { schedule: data }
})
