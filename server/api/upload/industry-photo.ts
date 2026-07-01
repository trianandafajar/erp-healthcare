export default defineEventHandler(async (event) => {
    const formData = await readFormData(event)

    const file = formData.get('file') as File | null

    if (!file)
        throw createError({
            statusCode: 400,
            message: 'No file provided.'
        })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type))
        throw createError({
            statusCode: 400,
            message: 'Invalid file type. Only JPG, PNG, or WebP allowed.'
        })

    if (file.size > 2 * 1024 * 1024)
        throw createError({
            statusCode: 400,
            message: 'File too large. Maximum 2 MB.'
        })

    const supabase = serverSupabase(event)

    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user)
        throw createError({
            statusCode: 401,
            message: 'Unauthorized.'
        })

    const admin = supabaseAdmin()

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `industries/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await admin.storage
        .from('landingpage-industries')
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true
        })

    if (uploadError)
        throw createError({
            statusCode: 500,
            message: uploadError.message
        })

    const { data: urlData } = admin.storage
        .from('landingpage-industries')
        .getPublicUrl(filePath)

    return { url: urlData.publicUrl }
})
