import { isUUID, checkField } from '~~/server/utils/validate'

export default withSuperadmin(async (event) => {
    const id = getRouterParam(event, 'id')

    checkField(isUUID(id), 'Invalid testimonial id')

    const { error } = await supabaseAdmin()
        .from('landingpage_testimonials')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
})