export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, message: 'Role ID is required' })
    }

    const admin = supabaseAdmin()

    const { data: usersWithRole } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role_id', id)
        .limit(1)

    if (usersWithRole && usersWithRole.length > 0) {
        throw createError({
            statusCode: 400,
            message: 'Cannot delete role that is still assigned to users'
        })
    }

    const { error } = await admin
        .from('roles')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'Role deleted successfully' }
})