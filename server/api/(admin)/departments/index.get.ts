export default defineEventHandler(async () => {
  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('departments')
    .select('*')
    .order('name')

  if (error) throw createError({ statusCode: 400, message: error.message })

  return { departments: data }
})