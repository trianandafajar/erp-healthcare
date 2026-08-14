import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event) => {
    const { admin, tenantId } = await getTenantContext(event)
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    checkFormat(isUUID(doctorId), 'ID', 'UUID')

    const body = await readBodyObject(event)

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

    if (updates.department_id !== undefined) checkFormat(isUUID(updates.department_id), 'department_id', 'UUID')
    if (updates.biography !== undefined) checkField(isShortText(updates.biography, 5000), 'Biography is too long')
    if (updates.is_available !== undefined) checkField(typeof updates.is_available === 'boolean', 'is_available must be a boolean')

    if (updates.experience_years !== undefined) {
        const n = toRequiredNumber(updates.experience_years, 'experience_years')
        checkField(isInt(n, { min: 0, max: 100 }), 'Experience years must be a valid integer')
        updates.experience_years = n
    }

    if (updates.consultation_fee !== undefined) {
        const n = toRequiredNumber(updates.consultation_fee, 'consultation_fee')
        checkField(n >= 0, 'Consultation fee must be a non-negative number')
        updates.consultation_fee = n
    }

    const { data, error } = await admin
        .from('doctors')
        .update(updates)
        .eq('id', doctorId)
        .eq('tenant_id', tenantId)
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