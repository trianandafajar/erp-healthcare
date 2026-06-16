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

    const { search } = getQuery(event)
    const keyword = typeof search === 'string' ? search.trim().toLowerCase() : ''

    const { data, error } = await admin
        .from('nurse_care_notes')
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
        .order('recorded_at', { ascending: false })
        .returns<any[]>()

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    const notes = (data ?? [])
        .map((item) => ({
            id: item.id,
            patient_id: item.patient_id,
            patient_name: item.patients?.full_name ?? '-',
            medical_record_number: item.patients?.medical_record_number ?? '-',
            category: item.category ?? 'Observation',
            note: item.note ?? '-',
            author_name: item.author_name ?? item.profiles?.full_name ?? 'Nurse',
            recorded_by: item.recorded_by ?? null,
            recorded_at: item.recorded_at,
        }))
        .filter((item) => {
            if (!keyword) return true

            return [
                item.patient_name,
                item.medical_record_number,
                item.category,
                item.author_name ?? '',
                item.note,
            ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
        })

    return { notes }
})
