import { getTenantContext } from "~~/server/utils/getTenantContext"

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
]

const ALLOWED_CATEGORIES = [
    'general',
    'lab',
    'imaging',
    'prescription',
    'referral',
    'other',
] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

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

    checkFormat(isUUID(medicalRecordId), 'medical_record_id', 'UUID')
    checkField(isShortText(title, 200), 'Title is too long')
    checkField(ALLOWED_CATEGORIES.includes(category as any), 'Invalid category')

    const fileType = file.type ?? ''
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        throw createError({ statusCode: 400, message: 'Invalid file type. Only PDF and image files are allowed' })
    }

    if (file.data.length > MAX_FILE_SIZE) {
        throw createError({ statusCode: 400, message: 'File too large. Maximum size is 10MB' })
    }

    if (file.data.length === 0) {
        throw createError({ statusCode: 400, message: 'File is empty' })
    }

    const ext = file.filename?.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'file'
    const fileName = `${crypto.randomUUID()}.${ext}`

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
            uploaded_by: user.id,
            tenant_id: tenantId
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