import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { is_public_booking } = await readBody(event)

    if (typeof is_public_booking !== 'boolean') {
        throw createError({ statusCode: 400, message: 'is_public_booking must be a boolean' })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: before, error: doctorError } = await admin
        .from('doctors')
        .select('id, is_public_booking')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (doctorError || !before) {
        throw createError({ statusCode: 404, message: 'Doctor profile not found' })
    }

    const { data, error } = await admin
        .from('doctors')
        .update({ is_public_booking })
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .select('is_public_booking')
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'schedules',
        p_entity_id: user.id,
        p_description: is_public_booking
            ? 'Enabled public booking for doctor schedule'
            : 'Disabled public booking for doctor schedule',
        p_metadata: { before: before.is_public_booking, after: is_public_booking },
    })

    return { is_public_booking: data.is_public_booking }
})
