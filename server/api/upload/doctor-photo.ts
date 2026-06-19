export default defineEventHandler(async (event) => {
    const formData = await readFormData(event)
    const file = formData.get('file') as File | null

    if (!file) {
        throw createError({ statusCode: 400, message: 'No file provided.' })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        throw createError({ statusCode: 400, message: 'Invalid file type. Only JPG, PNG, or WebP are allowed.' })
    }

    if (file.size > 2 * 1024 * 1024) {
        throw createError({ statusCode: 400, message: 'File too large. Maximum size is 2 MB.' })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `photos/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const supabase = supabaseAdmin()

    const { error: uploadError } = await supabase.storage
        .from('doctor-photos')
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) {
        throw createError({ statusCode: 500, message: uploadError.message })
    }

    const { data: urlData } = supabase.storage
        .from('doctor-photos')
        .getPublicUrl(filePath)

    return { url: urlData.publicUrl }
})