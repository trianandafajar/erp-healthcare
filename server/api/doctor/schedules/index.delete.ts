import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'schedule ID is required' })

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: before } = await admin
    .from('doctor_schedules')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('doctor_schedules')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'delete',
    p_module: 'schedule',
    p_entity_id: id,
    p_description: `Removed doctor schedules profile for ${(before as any)?.profiles?.full_name ?? 'a doctor schedules'}`,
    p_metadata: { before: before ?? null }
  })

  if (before?.doctor_id) {
    const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'], user?.id ?? null)
    const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'], user?.id ?? null)

    await insertNotifications(
      admin,
      [
        {
          user_id: before.doctor_id,
          type: 'schedule_deleted',
          title: 'Schedule deleted',
          body: `Your schedule for day ${before.day_of_week} has been deleted.`,
          data: {
            entity_type: 'doctor_schedule',
            entity_id: before.id,
            doctor_id: before.doctor_id,
            day_of_week: before.day_of_week,
            start_time: before.start_time,
            end_time: before.end_time,
            level: 'critical',
            audience_role: 'doctor',
            redirect_to: '/doctor/schedule',
          },
        },
        ...receptionistRecipientIds.map((user_id) => ({
          user_id,
          type: 'schedule_deleted',
          title: 'Doctor schedule removed',
          body: `A doctor schedule for day ${before.day_of_week} has been removed.`,
          data: {
            entity_type: 'doctor_schedule',
            entity_id: before.id,
            doctor_id: before.doctor_id,
            day_of_week: before.day_of_week,
            start_time: before.start_time,
            end_time: before.end_time,
            level: 'critical',
            audience_role: 'receptionist',
            redirect_to: '/receptionist/doctor-schedules',
          },
        })),
        ...adminRecipientIds.map((user_id) => ({
          user_id,
          type: 'schedule_deleted',
          title: 'Doctor schedule removed',
          body: `A doctor schedule for day ${before.day_of_week} has been removed.`,
          data: {
            entity_type: 'doctor_schedule',
            entity_id: before.id,
            doctor_id: before.doctor_id,
            day_of_week: before.day_of_week,
            start_time: before.start_time,
            end_time: before.end_time,
            level: 'critical',
            audience_role: 'admin',
          },
        })),
      ],
    )
  }

  return { message: 'Doctor Schedules removed successfully' }
})
