import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await admin
        .from('appointments')
        .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            type,
            chief_complaint,
 queue_number,
            patients (
                id,
                full_name,
                medical_record_number,
                gender
            )
        `)
        .eq('appointment_date', today)
        .eq('tenant_id', tenantId)
        .in('status', ['waiting', 'in_progress'])
        .order('appointment_time', { ascending: true })

    if (error) {
        throw createError({
            statusCode: 400,
            message: error.message
        })
    }

    return {
        examinations: data
    }
})