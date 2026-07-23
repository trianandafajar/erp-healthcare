import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const {
        id,
        department_id,
        phone,
        experience_years,
        is_available
    } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'User ID is required' })

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: hasRole } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', id)
        .returns<any[]>()

    const isNurse = hasRole?.some((r: any) => r.roles?.name === 'nurse')
    if (!isNurse) {
        throw createError({ statusCode: 400, message: 'User does not have nurse role' })
    }

    const { data, error } = await admin
        .from('nurses')
        .upsert({
            id,
            department_id,
            phone,
            experience_years,
            is_available: is_available ?? true,
            tenant_id: tenantId
        }, { onConflict: 'id' })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', id)
        .single()

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
        p_action: 'create',
        p_module: 'nurses',
        p_entity_id: data.id,
        p_description: `Created nurse profile for ${profile?.full_name ?? 'a nurse'}`,
        p_metadata: { after: data }
    })

    return { nurse: data }
})