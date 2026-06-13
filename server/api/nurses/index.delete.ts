export default defineEventHandler(async (event) => {
  const { id } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'Nurse ID is required' })

  const admin = supabaseAdmin()

  const { error } = await admin
    .from('nurses')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { message: 'Nurse profile removed successfully' }
})