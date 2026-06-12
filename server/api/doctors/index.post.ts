export default defineEventHandler(async (event) => {
  const {
    id,
    department_id,
    specialization,
    str_number,
    sip_number,
    phone,
    photo_url,
    biography,
    experience_years,
    consultation_fee,
    is_available
  } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'User ID is required' })

  const admin = supabaseAdmin()

  const { data: hasRole } = await admin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', id)
    .returns<any[]>()

  const isDoctor = hasRole?.some((r: any) => r.roles?.name === 'doctor')
  if (!isDoctor) {
    throw createError({ statusCode: 400, message: 'User does not have doctor role' })
  }

  const { data, error } = await admin
    .from('doctors')
    .insert({
      id,
      department_id,
      specialization,
      str_number,
      sip_number,
      phone,
      photo_url,
      biography,
      experience_years,
      consultation_fee,
      is_available: is_available ?? true
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { doctor: data }
})