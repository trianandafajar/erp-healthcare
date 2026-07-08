import { getTenantContext } from "~~/server/utils/getTenantContext"
import { requirePlanLimit } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event: any) => {
    const { admin, user, tenantId } = await getTenantContext(event)

    const { name, code, description } = await readBody(event)

    if (!name) throw createError({ statusCode: 400, message: 'Name is required' })

    const { count } = await admin
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    await requirePlanLimit(event, 'max_departments', count ?? 0)

    const { data, error } = await admin
        .from('departments')
        .insert({ name, code, description, tenant_id: tenantId })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'departments',
        p_entity_id: data.id,
        p_description: `Created department '${data.name}'`,
        p_metadata: { after: data }
    })

    return { department: data }
})