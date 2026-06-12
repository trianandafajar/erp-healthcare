export default defineEventHandler(async (event) => {
    const { name, label, module } = await readBody(event)

    if (!name || !label || !module) {
        throw createError({ statusCode: 400, message: 'Name, label, and module are required' })
    }

    const nameRegex = /^[a-z]+\.[a-z]+$/
    if (!nameRegex.test(name)) {
        throw createError({
            statusCode: 400,
            message: 'Permission name must be in format: module.action (e.g. user.view)'
        })
    }

    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('permissions')
        .insert({ name, label, module })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { permission: data }
})