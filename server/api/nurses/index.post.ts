export default defineEventHandler(async (event) => {
    const {
        id,
        department_id,
        phone,
        photo_url,
        experience_years,
        is_available
    } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'User ID is required' })

    const admin = supabaseAdmin()

    const { data: hasRole } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', id)
        .returns<any[]>()

    const isNurse = hasRole?.some((r: any) => r.roles?.name === 'nurse')
    if (!isNurse) {
        throw createError({ statusCode: 400, message: 'User does not have nurse role' })
    }

    const { data, error } = await admin
        .from('nurses')
        .insert({
            id,
            department_id,
            phone,
            photo_url,
            experience_years,
            is_available: is_available ?? true
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { nurse: data }
})