import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const {
    id,
    day_of_week,
    start_time,
    end_time,
    max_patients,
    is_active,
  } = await readBody(event)

  if (
    !id ||
    day_of_week === undefined ||
    !start_time ||
    !end_time ||
    max_patients === undefined
  ) {
    throw createError({
      statusCode: 400,
      message: 'id, day_of_week, start_time, end_time, and max_patients are required',
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
    .from('doctor_schedules')
    .select('*')
    .eq('id', id)
    .single()

  if (beforeError) {
    throw createError({
      statusCode: 404,
      message: 'Schedule not found',
    })
  }

  console.log('Updating schedule:', {
    id,
    start_time,
    end_time,
  })

  const { data, error } = await admin
    .from('doctor_schedules')
    .update({
      doctor_id: user.id,
      day_of_week,
      start_time,
      end_time,
      max_patients,
      is_active: is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Update schedule error:', error)

    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }

  await admin.rpc('log_activity', {
    p_actor_id: user.id,
    p_action: 'update',
    p_module: 'schedules',
    p_entity_id: data.id,
    p_description: `Schedule updated for day ${data.day_of_week} (${data.start_time} - ${data.end_time})`,
    p_metadata: {
      before,
      after: data,
    },
  })

  const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'], user.id)
  const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'], user.id)

  await insertNotifications(
    admin,
    [
      {
        user_id: user.id,
        type: 'schedule_updated',
        title: 'Schedule updated',
        body: `Your schedule for day ${data.day_of_week} has been updated.`,
        data: {
          entity_type: 'doctor_schedule',
          entity_id: data.id,
          doctor_id: user.id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          level: 'warning',
          audience_role: 'doctor',
          redirect_to: '/doctor/schedule',
        },
      },
      ...receptionistRecipientIds.map((user_id) => ({
        user_id,
        type: 'schedule_updated',
        title: 'Doctor schedule updated',
        body: `A doctor schedule for day ${data.day_of_week} has been updated.`,
        data: {
          entity_type: 'doctor_schedule',
          entity_id: data.id,
          doctor_id: user.id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          level: 'warning',
          audience_role: 'receptionist',
          redirect_to: '/receptionist/doctor-schedules',
        },
      })),
      ...adminRecipientIds.map((user_id) => ({
        user_id,
        type: 'schedule_updated',
        title: 'Doctor schedule updated',
        body: `A doctor schedule for day ${data.day_of_week} has been updated.`,
        data: {
          entity_type: 'doctor_schedule',
          entity_id: data.id,
          doctor_id: user.id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          level: 'warning',
          audience_role: 'admin',
        },
      })),
    ],
  )

  return {
    schedule: data,
  }
})
