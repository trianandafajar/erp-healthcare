export default defineEventHandler(async (event) => {
    const formData = await readFormData(event)
    const file = formData.get('file') as File | null

    if (!file)
        throw createError({ statusCode: 400, message: 'No file provided.' })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type))
        throw createError({ statusCode: 400, message: 'Invalid file type. Only JPG, PNG, or WebP are allowed.' })

    if (file.size > 2 * 1024 * 1024)
        throw createError({ statusCode: 400, message: 'File too large. Maximum size is 2 MB.' })

    const supabase = await serverSupabase(event)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user)
        throw createError({ statusCode: 401, message: 'Unauthorized.' })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `avatars/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const admin = supabaseAdmin()

    const { error: uploadError } = await admin.storage
        .from('profile-avatars')
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
        })

    if (uploadError)
        throw createError({ statusCode: 500, message: uploadError.message })

    const { data: urlData } = admin.storage
        .from('profile-avatars')
        .getPublicUrl(filePath)

    const { error: updateError } = await admin
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id)

    if (updateError)
        throw createError({ statusCode: 500, message: updateError.message })

    return { url: urlData.publicUrl }
})