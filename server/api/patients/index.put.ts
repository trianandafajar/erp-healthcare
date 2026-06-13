export default defineEventHandler(async (event) => {
  const { id, full_name, date_of_birth, gender, phone, address, blood_type } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Patient ID is required' })

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('patients')
    .update({ full_name, date_of_birth, gender, phone, address, blood_type })
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { message: 'Patient updated successfully' }
})