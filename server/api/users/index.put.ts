export default defineEventHandler(async (event) => {
    const { id, full_name, role, status } = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required',
        })
    }

    const admin = supabaseAdmin()

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
        user_metadata: { full_name, role },
    })

    if (authError) throw createError({ statusCode: 400, message: authError.message })

    const { error: profileError } = await admin
        .from('profiles')
        .update({ full_name, role, status })
        .eq('id', id)

    if (profileError) throw createError({ statusCode: 400, message: profileError.message })

    return { message: 'User updated successfully' }
})