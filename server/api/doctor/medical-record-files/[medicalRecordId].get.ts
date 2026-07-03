import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

    const medicalRecordId =
        event.context.params?.medicalRecordId

    const { data, error } = await admin
        .from('medical_record_files')
        .select('*')
        .eq('medical_record_id', medicalRecordId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }

    return {
        files: data
    }
})