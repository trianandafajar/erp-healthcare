import { requirePlanFeature } from "~~/server/utils/planGuard"
import { getTenantContext } from "~~/server/utils/getTenantContext"
import { isUUID, isEnum, checkField, checkFormat } from "~~/server/utils/validate"

const BILLING_STATUSES = ['Paid', 'Pending', 'Unpaid']

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'billing')
    const { admin, tenantId } = await getTenantContext(event)
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    checkField(isUUID(id), 'Invalid billing id')
    checkFormat(isEnum(body.status, BILLING_STATUSES), 'status', `one of: ${BILLING_STATUSES.join(', ')}`)

    const { error } = await admin
        .from('billing')
        .update({
            status: body.status,
            paid_at: body.status === 'Paid' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { success: true }
})