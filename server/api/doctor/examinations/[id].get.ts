import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const appointmentId = getRouterParam(event, 'id')

    if (!appointmentId) {
        throw createError({
            statusCode: 400,
            message: 'Appointment ID is required'
        })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

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
        .eq('tenant_id', tenantId)
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