export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const body = await readBody(event)

    const allowed = [
        'specialization',
        'sip_number',
        'str_number',
        'phone',
        'department_id',
        'biography',
        'experience_years',
        'consultation_fee',
        'is_available',
    ]

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await admin
        .from('doctors')
        .update(updates)
        .eq('id', doctorId)
        .select(`
            id,
            specialization,
            sip_number,
            str_number,
            phone,
            biography,
            experience_years,
            consultation_fee,
            is_available,
            updated_at,
            profiles ( full_name, email, avatar_url ),
            departments:department_id ( id, name, code )
        `)
        .single()
        .returns<any>()

    if (error) throw createError({ statusCode: 400, message: error.message })
    if (!data) throw createError({ statusCode: 404, message: 'Doctor not found' })

    return { data }
})