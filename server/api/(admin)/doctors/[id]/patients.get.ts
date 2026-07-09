export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const { page = '1', limit = '10' } = getQuery(event)
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    const { data: records, error } = await admin
        .from('medical_records')
        .select(`
            patient_id,
            patients:patient_id (
                id,
                full_name,
                medical_record_number,
                gender,
                date_of_birth,
                phone,
                blood_type,
                address
            )
        `)
        .eq('doctor_id', doctorId)
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const seen = new Set<string>()
    const patients: any[] = []
    for (const row of records ?? []) {
        if (row.patients && !seen.has(row.patient_id)) {
            seen.add(row.patient_id)
            patients.push(row.patients)
        }
    }

    const total = patients.length
    const paginated = patients.slice(offset, offset + limitNum)

    return {
        data: paginated,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            total_pages: Math.ceil(total / limitNum),
        },
    }
})