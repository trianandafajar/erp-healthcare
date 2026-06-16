export default defineEventHandler(async () => {
  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('medical_records')
    .select(`
      *,
      patients (
        id,
        full_name,
        medical_record_number
      ),
      appointments (
        appointment_date,
        appointment_time
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message
    })
  }

  return {
    medical_records: data
  }
})