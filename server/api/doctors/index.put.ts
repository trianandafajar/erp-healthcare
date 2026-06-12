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

  if (!id) throw createError({ statusCode: 400, message: 'Doctor ID is required' })

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('doctors')
    .update({
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
    })
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { message: 'Doctor updated successfully' }
})