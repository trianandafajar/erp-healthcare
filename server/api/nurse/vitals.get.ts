import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'nurse_module')
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

    const { data, error } = await admin
        .from('nurse_vital_signs')
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

    const vitals = (data ?? []).map((item) => ({
        id: item.id,
        patient_id: item.patient_id,
        patient_name: item.patients?.full_name ?? '-',
        medical_record_number: item.patients?.medical_record_number ?? '-',
        recorded_by: item.recorded_by ?? null,
        recorded_by_name: item.profiles?.full_name ?? null,
        blood_pressure: item.blood_pressure ?? '-',
        temperature: item.temperature ?? null,
        weight: item.weight ?? null,
        height: item.height ?? null,
        pulse: item.pulse ?? null,
        notes: item.notes ?? null,
        recorded_at: item.recorded_at,
    }))

    return { vitals }
})
