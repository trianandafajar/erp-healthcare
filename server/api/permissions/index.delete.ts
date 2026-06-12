export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Permission ID is required' })

    const admin = supabaseAdmin()

    const { data: usedByRole } = await admin
        .from('role_permissions')
        .select('role_id')
        .eq('permission_id', id)
        .limit(1)

    if (usedByRole && usedByRole.length > 0) {
        throw createError({
            statusCode: 400,
            message: 'Cannot delete permission that is still assigned to a role'
        })
    }

    const { error } = await admin
        .from('permissions')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'Permission deleted successfully' }
})