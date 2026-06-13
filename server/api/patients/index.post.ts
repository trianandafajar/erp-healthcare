export default defineEventHandler(async (event) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type } = await readBody(event)

  if (!full_name) {
    throw createError({ statusCode: 400, message: 'Full name is required' })
  }

  const admin = supabaseAdmin()

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

  return { patient: data }
})