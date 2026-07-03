export default defineEventHandler(async (event) => {
    const { user } = await serverSupabase(event).auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const body = await readMultipartFormData(event)
    if (!body?.length) throw createError({ statusCode: 400, message: 'No file provided' })

    const file = body[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!file.type || !allowedTypes.includes(file.type)) {
        throw createError({ statusCode: 400, message: 'Only JPG, PNG, or WebP images are allowed.' })
    }

    const maxSize = 2 * 1024 * 1024
    if ((file.data?.length ?? 0) > maxSize) {
        throw createError({ statusCode: 400, message: 'Image must be smaller than 2 MB.' })
    }

    const ext = file.type.split('/')[1] ?? 'png'
    const fileName = `testimonials/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabaseAdmin().storage
        .from('landingpage-testimonials')
        .upload(fileName, file.data, {
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) throw createError({ statusCode: 500, message: uploadError.message })

    const { data: { publicUrl } } = supabaseAdmin().storage
        .from('landingpage-testimonials')
        .getPublicUrl(fileName)

    return { url: publicUrl }
})