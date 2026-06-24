export default defineEventHandler(async (event) => {
  const {
    id,
    department_id,
    specialization,
    str_number,
    sip_number,
    phone,
    biography,
    experience_years,
    consultation_fee,
    is_available
  } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Doctor ID is required' })

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: before } = await admin
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await admin
    .from('doctors')
    .update({
      department_id,
      specialization,
      str_number,
      sip_number,
      phone,
      biography,
      experience_years,
      consultation_fee,
      is_available
    })
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'update',
    p_module: 'doctors',
    p_entity_id: id,
    p_description: `Updated doctor profile for ${specialization ?? before?.specialization ?? 'a doctor'}`,
    p_metadata: {
      before: before ?? null,
      after: {
        department_id,
        specialization,
        str_number,
        sip_number,
        phone,
        biography,
        experience_years,
        consultation_fee,
        is_available
      }
    }
  })

  return { message: 'Doctor updated successfully' }
})