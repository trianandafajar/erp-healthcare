export default defineEventHandler(async (event) => {
    const { id, name, label, permissions } = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, message: 'Role ID is required' })
    }

    const admin = supabaseAdmin()

    const { error: roleError } = await admin
        .from('roles')
        .update({ name, label })
        .eq('id', id)

    if (roleError) throw createError({ statusCode: 400, message: roleError.message })

    if (permissions !== undefined) {
        await admin.from('role_permissions').delete().eq('role_id', id)

        if (permissions.length > 0) {
            const rolePermissions = permissions.map((permission_id: string) => ({
                role_id: id,
                permission_id
            }))

            const { error: permError } = await admin
                .from('role_permissions')
                .insert(rolePermissions)

            if (permError) throw createError({ statusCode: 400, message: permError.message })
        }
    }

    return { message: 'Role updated successfully' }
})