import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const query = getQuery(event)
    const date = typeof query.date === 'string' ? query.date : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw createError({ statusCode: 400, message: 'Invalid date. Expected YYYY-MM-DD.' })
    }

    const { data: doctor, error: doctorError } = await admin
        .from('doctors')
        .select('id')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (doctorError || !doctor) {
        throw createError({ statusCode: 404, message: 'Doctor profile not found' })
    }

    const { data: appointments, error } = await admin
        .from('appointments')
        .select(`
            id,
            patient_id,
            appointment_date,
            appointment_time,
            type,
            status,
            chief_complaint,
            notes,
            queue_number,
            created_at,
            patients(full_name, medical_record_number)
        `)
        .eq('doctor_id', doctor.id)
        .eq('tenant_id', tenantId)
        .eq('appointment_date', date)
        .order('appointment_time', { ascending: true })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { date, appointments }
})