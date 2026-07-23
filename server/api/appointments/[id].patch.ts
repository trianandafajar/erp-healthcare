import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data, error } = await admin
        .from('appointments')
        .update(body)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'appointments',
        p_entity_id: data.id,
        p_description: `Updated appointment ${id}`,
        p_metadata: { after: data }
    })

    return { appointment: data }
})