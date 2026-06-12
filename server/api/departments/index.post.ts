export default defineEventHandler(async (event) => {
    const { name, code, description } = await readBody(event)

    if (!name) throw createError({ statusCode: 400, message: 'Name is required' })

    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('departments')
        .insert({ name, code, description })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { department: data }
})