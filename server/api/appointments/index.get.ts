import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

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
            queue_number,
            created_at,
            updated_at,
            patient:patients(id, full_name, medical_record_number),
            doctor:doctors(
                id,
                department_id,
                specialization,
                profile:profiles(id, full_name),
                department:departments(id, name)
            ),
            department:departments(id, name)
        `)
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })

    return { appointments: data }
})  