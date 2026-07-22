export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required',
        })
    }

    const admin = supabaseAdmin()

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