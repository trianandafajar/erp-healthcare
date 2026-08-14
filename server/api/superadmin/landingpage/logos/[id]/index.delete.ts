import { isUUID, checkField } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')

    checkField(isUUID(id), 'Invalid logo id')

    const { error } = await supabaseAdmin()
        .from('landingpage_logos')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
})
