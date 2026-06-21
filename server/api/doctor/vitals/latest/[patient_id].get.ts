export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const patientId = getRouterParam(event, 'patient_id')

    if (!patientId) {
        throw createError({ statusCode: 400, message: 'patient_id is required' })
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

    if (role !== 'doctor') {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const { data, error } = await admin
        .from('nurse_vital_signs')
        .select(`
      blood_pressure,
      temperature,
      weight,
      height,
      pulse
    `)
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .returns<any[]>() as any

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    const latest = (data ?? [])[0] ?? null

    return {
        vital: latest
            ? {
                blood_pressure: latest.blood_pressure ?? '',
                temperature: latest.temperature ?? null,
                weight: latest.weight ?? null,
                height: latest.height ?? null,
                heart_rate: latest.pulse ?? null,
            }
            : null,
    }
})
