import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const patientId = getRouterParam(event, 'id')

    if (!patientId) {
        throw createError({ statusCode: 400, message: 'Patient ID is required' })
    }

    const { data, error } = await admin
        .from('medical_records')
        .select('id, diagnosis, created_at')
        .eq('patient_id', patientId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const medicalRecords = (data ?? []).map((mr) => ({
        id: mr.id,
        diagnosis: mr.diagnosis ?? '-',
        date: mr.created_at,
    }))

    return { medicalRecords }
})
