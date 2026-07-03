import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

    const id = event.context.params?.id

    const { data: file, error } = await admin
        .from('medical_record_files')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

    if (error || !file) {
        throw createError({
            statusCode: 404,
            message: 'File not found'
        })
    }

    const { data, error: signedError } =
        await admin.storage
            .from('medical-records')
            .createSignedUrl(
                file.file_url,
                60 * 5
            )

    if (signedError) {
        throw createError({
            statusCode: 500,
            message: signedError.message
        })
    }

    return {
        url: data.signedUrl
    }
})