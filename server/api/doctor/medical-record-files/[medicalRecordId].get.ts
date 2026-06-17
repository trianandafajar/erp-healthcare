export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()

    const medicalRecordId =
        event.context.params?.medicalRecordId

    const { data, error } = await admin
        .from('medical_record_files')
        .select('*')
        .eq('medical_record_id', medicalRecordId)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }

    return {
        files: data
    }
})