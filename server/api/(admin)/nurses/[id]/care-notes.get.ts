export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const nurseId = getRouterParam(event, 'id')

    if (!nurseId) throw createError({ statusCode: 400, message: 'Nurse ID is required' })

    const { page = '1', limit = '10' } = getQuery(event)
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    const { data, error, count } = await admin
        .from('nurse_care_notes')
        .select(`
            id,
            category,
            note,
            author_name,
            recorded_at,
            patients:patient_id ( id, full_name, medical_record_number )
        `, { count: 'exact' })
        .eq('recorded_by', nurseId)
        .order('recorded_at', { ascending: false })
        .range(offset, offset + limitNum - 1)
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return {
        data: data ?? [],
        meta: { total: count ?? 0, page: pageNum, limit: limitNum },
    }
})