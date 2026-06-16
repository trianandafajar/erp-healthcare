export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const { data: roleData, error: roleError } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    if (roleError) {
        throw createError({ statusCode: 400, message: roleError.message })
    }

    const role = (roleData as any)?.[0]?.roles?.name

    if (role !== 'nurse') {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const body = await readBody(event)
    const id = typeof body.id === 'string' ? body.id.trim() : ''

    if (!id) {
        throw createError({ statusCode: 400, message: 'Vital sign ID is required' })
    }

    const { error } = await admin
        .from('nurse_vital_signs')
        .delete()
        .eq('id', id)

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    return { success: true }
})
