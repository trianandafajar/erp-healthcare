export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const { data: roleData, error: roleError } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    if (roleError) {
        throw createError({ statusCode: 400, message: roleError.message })
    }

    const role = (roleData as any)?.[0]?.roles?.name

    if (role !== 'nurse') {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const body = await readBody(event)
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const patientId = typeof body.patient_id === 'string' ? body.patient_id.trim() : ''
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Observation'
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    const authorName = typeof body.author_name === 'string' && body.author_name.trim() ? body.author_name.trim() : 'Nurse'

    if (!id) {
        throw createError({ statusCode: 400, message: 'Note ID is required' })
    }

    if (!patientId) {
        throw createError({ statusCode: 400, message: 'Patient is required' })
    }

    if (!note) {
        throw createError({ statusCode: 400, message: 'Note content is required' })
    }

    const { data, error } = await admin
        .from('nurse_care_notes')
        .update({
            patient_id: patientId,
            category,
            note,
            author_name: authorName,
        })
        .eq('id', id)
        .select(`
            id,
            patient_id,
            recorded_by,
            category,
            note,
            author_name,
            recorded_at,
            patients (
                full_name,
                medical_record_number
            ),
            profiles (
                full_name
            )
        `)
        .single()

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    return {
        note: {
            id: data.id,
            patient_id: data.patient_id,
            patient_name: data.patients?.full_name ?? '-',
            medical_record_number: data.patients?.medical_record_number ?? '-',
            category: data.category ?? category,
            note: data.note ?? note,
            author_name: data.author_name ?? data.profiles?.full_name ?? authorName,
            recorded_by: data.recorded_by ?? null,
            recorded_at: data.recorded_at,
        },
    }
})
