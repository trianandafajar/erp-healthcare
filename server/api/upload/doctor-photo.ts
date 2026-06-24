export default defineEventHandler(async (event) => {
    const formData = await readFormData(event)

    const file = formData.get('file') as File | null
    const profileId = formData.get('profile_id') as string | null

    if (!profileId)
        throw createError({
            statusCode: 400,
            message: 'Profile ID is required.'
        })

    if (!file)
        throw createError({
            statusCode: 400,
            message: 'No file provided.'
        })

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ]

    if (!allowedTypes.includes(file.type))
        throw createError({
            statusCode: 400,
            message: 'Invalid file type.'
        })

    if (file.size > 2 * 1024 * 1024)
        throw createError({
            statusCode: 400,
            message: 'File too large.'
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

    // const { data: doctor } = await admin
    //     .from('doctors')
    //     .select('id')
    //     .eq('id', doctorId)
    //     .single()

    // if (!doctor)
    //     throw createError({
    //         statusCode: 404,
    //         message: 'Doctor not found.'
    //     })

    const ext = file.name.split('.').pop() ?? 'jpg'

    const fileName = `${crypto.randomUUID()}.${ext}`

    const filePath = `avatars/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await admin.storage
        .from('profile-avatars')
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
        .from('profile-avatars')
        .getPublicUrl(filePath)

    const { error: updateError } = await admin
        .from('profiles')
        .update({
            avatar_url: urlData.publicUrl
        })
        .eq('id', profileId)

    if (updateError)
        throw createError({
            statusCode: 500,
            message: updateError.message
        })

    return {
        url: urlData.publicUrl
    }
})