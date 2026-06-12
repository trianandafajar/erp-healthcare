export default defineEventHandler(async (event) => {
    const { name, label, permissions } = await readBody(event)

    if (!name || !label) {
        throw createError({ statusCode: 400, message: 'Name and label are required' })
    }

    const admin = supabaseAdmin()

    const { data: role, error: roleError } = await admin
        .from('roles')
        .insert({ name, label })
        .select()
        .single()

    if (roleError) throw createError({ statusCode: 400, message: roleError.message })

    if (permissions?.length > 0) {
        const rolePermissions = permissions.map((permission_id: string) => ({
            role_id: role.id,
            permission_id
        }))

        const { error: permError } = await admin
            .from('role_permissions')
            .insert(rolePermissions)

        if (permError) throw createError({ statusCode: 400, message: permError.message })
    }

    return { role }
})