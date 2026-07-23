import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { id, full_name, status } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: before } = await admin
        .from('profiles')
        .select('full_name, status, email')
        .eq('id', id)
        .single()

    if (full_name) {
        await admin.auth.admin.updateUserById(id, { user_metadata: { full_name, role: 'pharmacy' } })
    }

    const updateData: Record<string, any> = {}
    if (full_name) updateData.full_name = full_name
    if (status) updateData.status = status

    if (Object.keys(updateData).length) {
        await admin.from('profiles').update(updateData).eq('id', id)
    }

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'pharmacies',
        p_entity_id: id,
        p_description: `Updated pharmacist '${full_name ?? before?.full_name}'`,
        p_metadata: { before: before ?? null, after: { full_name, status } }
    })

    return { message: 'Pharmacist updated successfully' }
})
