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

  return { message: 'Doctor Schedules removed successfully' }
})