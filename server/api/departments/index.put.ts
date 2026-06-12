export default defineEventHandler(async (event) => {
    const { id, name, code, description } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Department ID is required' })

    const admin = supabaseAdmin()

    const { error } = await admin
        .from('departments')
        .update({ name, code, description })
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'Department updated successfully' }
})