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
    const bloodPressure = typeof body.blood_pressure === 'string' ? body.blood_pressure.trim() : ''
    const temperature = body.temperature === '' || body.temperature == null ? null : Number(body.temperature)
    const weight = body.weight === '' || body.weight == null ? null : Number(body.weight)
    const height = body.height === '' || body.height == null ? null : Number(body.height)
    const pulse = body.pulse === '' || body.pulse == null ? null : Number(body.pulse)
    const notes = typeof body.notes === 'string' ? body.notes.trim() : null

    if (!id) {
        throw createError({ statusCode: 400, message: 'Vital sign ID is required' })
    }

    if (!patientId) {
        throw createError({ statusCode: 400, message: 'Patient is required' })
    }

    if (!bloodPressure) {
        throw createError({ statusCode: 400, message: 'Blood pressure is required' })
    }

    const { data, error } = await admin
        .from('nurse_vital_signs')
        .update({
            patient_id: patientId,
            blood_pressure: bloodPressure,
            temperature: Number.isFinite(temperature) ? temperature : null,
            weight: Number.isFinite(weight) ? weight : null,
            height: Number.isFinite(height) ? height : null,
            pulse: Number.isFinite(pulse) ? pulse : null,
            notes,
        })
        .eq('id', id)
        .select(`
            id,
            patient_id,
            recorded_by,
            blood_pressure,
            temperature,
            weight,
            height,
            pulse,
            notes,
            recorded_at,
            patients (
                full_name,
                medical_record_number
            )
        `)
        .single()

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    return {
        vital: {
            id: data.id,
            patient_id: data.patient_id,
            patient_name: data.patients?.full_name ?? '-',
            medical_record_number: data.patients?.medical_record_number ?? '-',
            blood_pressure: data.blood_pressure ?? '-',
            temperature: data.temperature ?? null,
            weight: data.weight ?? null,
            height: data.height ?? null,
            pulse: data.pulse ?? null,
            notes: data.notes ?? null,
            recorded_at: data.recorded_at,
        },
    }
})
