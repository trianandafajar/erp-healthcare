export default defineEventHandler(async (event) => {
  const {
    id,
    department_id,
    phone,
    photo_url,
    experience_years,
    is_available
  } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Nurse ID is required' })

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('nurses')
    .update({
      department_id,
      phone,
      photo_url,
      experience_years,
      is_available
    })
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { message: 'Nurse updated successfully' }
})