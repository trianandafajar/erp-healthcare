import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'billing')
    const admin = supabaseAdmin()
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const { error } = await admin
        .from('billing')
        .update({
            status: body.status,
            paid_at: body.status === 'Paid' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { success: true }
})