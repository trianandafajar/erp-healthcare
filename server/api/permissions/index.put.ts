export default defineEventHandler(async (event) => {
    const { id, name, label, module } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Permission ID is required' })

    const admin = supabaseAdmin()

    const { error } = await admin
        .from('permissions')
        .update({ name, label, module })
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'Permission updated successfully' }
})