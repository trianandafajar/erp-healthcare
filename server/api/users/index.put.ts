export default defineEventHandler(async (event) => {
    const { id, full_name, role, status } = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const admin = supabaseAdmin()

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
        user_metadata: { full_name },
    })
    if (authError) throw createError({ statusCode: 400, message: authError.message })

    // update profile
    const { error: profileError } = await admin
        .from('profiles')
        .update({ full_name, status })
        .eq('id', id)
    if (profileError) throw createError({ statusCode: 400, message: profileError.message })

    // update role di user_roles
    if (role) {
        const { data: roleData, error: roleError } = await admin
            .from('roles')
            .select('id')
            .eq('name', role)
            .single()

        if (roleError || !roleData) {
            throw createError({ statusCode: 400, message: `Role '${role}' not found` })
        }

        // hapus role lama, insert role baru
        await admin.from('user_roles').delete().eq('user_id', id)

        const { error: userRoleError } = await admin
            .from('user_roles')
            .insert({ user_id: id, role_id: roleData.id })

        if (userRoleError) {
            throw createError({ statusCode: 400, message: userRoleError.message })
        }
    }

    return { message: 'User updated successfully' }
})