import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event) => {
    const { admin, tenantId } = await getTenantContext(event)

    const { data, error } = await admin
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    if (error) throw createError({ statusCode: 500, message: error.message })

    return data ?? null
})
