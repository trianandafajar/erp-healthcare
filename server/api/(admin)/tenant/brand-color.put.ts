import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const body = await readBody(event)
    const { brand_color } = body

    if (!brand_color || !/^#[0-9a-fA-F]{6}$/.test(brand_color)) {
        throw createError({ statusCode: 400, message: 'Invalid color format. Use hex format (e.g. #176D37)' })
    }

    const { error } = await admin
        .from('tenants')
        .update({ brand_color })
        .eq('id', tenantId)

    if (error) throw createError({ statusCode: 500, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'tenant',
        p_entity_id: tenantId,
        p_description: `Updated brand color to ${brand_color}`,
        p_metadata: { brand_color },
    })

    return { brand_color }
})
