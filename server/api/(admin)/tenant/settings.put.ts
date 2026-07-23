import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const body = await readBody(event)
    const { display_name, logo_url } = body

    if (display_name === undefined && logo_url === undefined) {
        throw createError({ statusCode: 400, message: 'No fields to update. Provide display_name and/or logo_url.' })
    }

    const { data: existing } = await admin
        .from('tenant_settings')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    const payload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (display_name !== undefined) payload.display_name = display_name
    if (logo_url !== undefined) payload.logo_url = logo_url

    let result
    if (existing) {
        const { data, error } = await admin
            .from('tenant_settings')
            .update(payload)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (error) throw createError({ statusCode: 500, message: error.message })
        result = data
    } else {
        const { data, error } = await admin
            .from('tenant_settings')
            .insert({ tenant_id: tenantId, ...payload })
            .select()
            .single()

        if (error) throw createError({ statusCode: 500, message: error.message })
        result = data
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'tenant',
        p_entity_id: tenantId,
        p_description: 'Updated healthcare branding settings',
        p_metadata: { display_name, logo_url },
    })

    return result
})
