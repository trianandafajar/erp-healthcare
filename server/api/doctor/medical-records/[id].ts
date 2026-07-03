import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

    const id = event.context.params?.id

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Medical record ID is required'
        })
    }

    const { data, error } = await admin
        .from('medical_records')
        .select(`
            *,
            patients (
                id,
                full_name,
                medical_record_number,
                gender
            ),
            appointments (
                id,
                appointment_date,
                appointment_time,
                type,
                status
            ),
            prescriptions (
                id,
                medication_name,
                dosage,
                frequency,
                duration,
                instructions,
                created_at
            )
        `)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

    if (error) {
        throw createError({
            statusCode: 404,
            message: error.message
        })
    }

    return {
        medical_record: data
    }
})