import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { email, password, full_name, status } = await readBody(event)

    if (!email || !password || !full_name) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, and full name are required.',
        })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: foundRole } = await admin
        .from('roles')
        .select('id')
        .eq('name', 'receptionist')
        .single()

    if (!foundRole) {
        throw createError({ statusCode: 400, message: 'Receptionist role not found' })
    }

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: 'receptionist' },
    })

    if (error) throw createError({ statusCode: 400, message: error.message })

    const userId = data.user.id

    const { error: profileError } = await admin
        .from('profiles')
        .update({ tenant_id: tenantId, ...(status && { status }) })
        .eq('id', userId)

    if (profileError) throw createError({ statusCode: 400, message: profileError.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
        p_action: 'create',
        p_module: 'receptionists',
        p_entity_id: userId,
        p_description: `Created receptionist '${full_name}' (${email})`,
        p_metadata: { after: { email, full_name, status } }
    })

    return { receptionist: { id: userId, ...data.user } }
})
