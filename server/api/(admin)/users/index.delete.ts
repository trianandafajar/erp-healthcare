import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event) => {
    const body = await readBodyObject(event)
    const id = body?.id

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required',
        })
    }

    checkFormat(isUUID(id), 'ID', 'UUID')

    const { admin, tenantId, user } = await getTenantContext(event)

    if (user.id === id) {
        throw createError({ statusCode: 400, message: 'You cannot delete your own account' })
    }

    const { data: targetProfile, error: profileError } = await admin
        .from('profiles')
        .select('tenant_id')
        .eq('id', id)
        .maybeSingle()

    if (profileError || !targetProfile) {
        throw createError({ statusCode: 404, message: 'User not found' })
    }

    if (targetProfile.tenant_id !== tenantId) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const { error: patientDeleteError } = await admin
        .from('patients')
        .delete()
        .eq('profile_id', id)

    if (patientDeleteError) {
        await admin.from('patients').update({ profile_id: null }).eq('profile_id', id)
    }

    const { error } = await admin.auth.admin.deleteUser(id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'User deleted successfully' }
})