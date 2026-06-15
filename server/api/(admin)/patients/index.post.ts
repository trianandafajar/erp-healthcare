export default defineEventHandler(async (event) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type } = await readBody(event)

  if (!full_name) {
    throw createError({ statusCode: 400, message: 'Full name is required' })
  }

  const admin = supabaseAdmin()
  const supabase = serverSupabase(event)
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await admin
    .from('patients')
    .insert({
      full_name,
      date_of_birth,
      gender,
      phone,
      address,
      blood_type
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'create',
    p_module: 'patients',
    p_entity_id: data.id,
    p_description: `Created patient ${data.full_name} (${data.medical_record_number ?? '-'})`,
    p_metadata: { after: data }
  })

  return { patient: data }
})