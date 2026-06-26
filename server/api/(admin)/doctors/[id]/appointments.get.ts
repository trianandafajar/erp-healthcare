export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const { status, date, page = '1', limit = '20' } = getQuery(event)

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    let q = admin
        .from('appointments')
        .select(`
            id,
            appointment_date,
            appointment_time,
            type,
            status,
            chief_complaint,
            queue_number,
            notes,
            created_at,
            patients:patient_id (
                id,
                full_name,
                medical_record_number,
                gender,
                date_of_birth,
                phone
            ),
            departments:department_id ( id, name, code )
        `, { count: 'exact' })
        .eq('doctor_id', doctorId)

    if (status) q = q.eq('status', status as string)
    if (date) q = q.eq('appointment_date', date as string)

    q = q
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true })
        .range(offset, offset + limitNum - 1)

    const { data, error, count } = await q.returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return {
        data: data ?? [],
        meta: {
            total: count ?? 0,
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil((count ?? 0) / limitNum),
        },
    }
})