export default defineEventHandler(async (event) => {
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

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { data, error } = await admin
    .from('doctor_schedules')
    .insert({
      doctor_id: user.id,
      day_of_week,
      start_time,
      end_time,
      max_patients,
      is_active: is_active ?? true,
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

  return { schedule: data }
})