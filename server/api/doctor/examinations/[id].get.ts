export default defineEventHandler(async (event) => {
    const appointmentId = getRouterParam(event, 'id')

    if (!appointmentId) {
        throw createError({
            statusCode: 400,
            message: 'Appointment ID is required'
        })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    const { data, error } = await admin
        .from('appointments')
        .select(`
      id,
      appointment_date,
      appointment_time,
      type,
      status,
      chief_complaint,
      notes,
      doctor_id,

      patients (
        id,
        full_name,
        medical_record_number,
        gender,
        date_of_birth,
        phone,
        address
      )
    `)
        .eq('id', appointmentId)
        .single()

    if (error) {
        throw createError({
            statusCode: 404,
            message: error.message
        })
    }

    return {
        appointment: data
    }
})