export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const id = getRouterParam(event, 'id')

    const { error } = await admin
        .from('landingpage_industries')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })
    return { success: true }
})
