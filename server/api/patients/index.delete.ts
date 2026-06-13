export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Patient ID is required' })

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { message: 'Patient deleted successfully' }
})