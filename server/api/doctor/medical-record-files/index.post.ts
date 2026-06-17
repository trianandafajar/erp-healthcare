export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()

    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    const form = await readMultipartFormData(event)

    if (!form) {
        throw createError({
            statusCode: 400,
            message: 'No form data received'
        })
    }

    const medicalRecordId = form.find(
        item => item.name === 'medical_record_id'
    )?.data.toString()

    const title = form.find(
        item => item.name === 'title'
    )?.data.toString()

    const category = form.find(
        item => item.name === 'category'
    )?.data.toString() || 'general'

    const file = form.find(
        item => item.name === 'file'
    )

    if (!medicalRecordId || !title || !file) {
        throw createError({
            statusCode: 400,
            message: 'medical_record_id, title and file are required'
        })
    }

    const fileName = `${Date.now()}-${file.filename}`

    const filePath = `${medicalRecordId}/${fileName}`

    const { error: uploadError } = await admin.storage
        .from('medical-records')
        .upload(filePath, file.data, {
            contentType: file.type,
            upsert: false
        })

    if (uploadError) {
        throw createError({
            statusCode: 500,
            message: uploadError.message
        })
    }

    const { data, error } = await admin
        .from('medical_record_files')
        .insert({
            medical_record_id: medicalRecordId,
            title,
            file_name: file.filename,
            file_url: filePath,
            file_type: file.type,
            file_size: file.data.length,
            category,
            uploaded_by: user.id
        })
        .select()
        .single()

    if (error) {
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }

    return {
        success: true,
        file: data
    }
})