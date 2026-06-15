export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Appointment ID is required',
    })
  }

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: before } = await admin
    .from('appointments')
    .select(`
      *,
      patients (
        full_name,
        medical_record_number
      )
    `)
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'delete',
    p_module: 'appointments',
    p_entity_id: id,
    p_description: `Removed appointment for ${(before as any)?.patients?.full_name ?? 'a patient'}`,
    p_metadata: {
      before: before ?? null,
    },
  })

  return {
    message: 'Appointment removed successfully',
  }
})