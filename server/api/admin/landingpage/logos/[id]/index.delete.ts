export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    const { error } = await supabaseAdmin()
        .from('landingpage_logos')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
})
