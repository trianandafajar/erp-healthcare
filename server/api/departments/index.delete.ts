export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Department ID is required' })

    const admin = supabaseAdmin()

    const { data: usedByDoctor } = await admin
        .from('doctors')
        .select('id')
        .eq('department_id', id)
        .limit(1)

    if (usedByDoctor?.length) {
        throw createError({ statusCode: 400, message: 'Cannot delete department that has doctors' })
    }

    const { error } = await admin
        .from('departments')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'Department deleted successfully' }
})