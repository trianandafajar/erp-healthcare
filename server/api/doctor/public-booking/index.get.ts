import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const { data, error } = await admin
        .from('doctors')
        .select('is_public_booking')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (error || !data) {
        throw createError({ statusCode: 404, message: 'Doctor profile not found' })
    }

    return { is_public_booking: data.is_public_booking ?? false }
})
