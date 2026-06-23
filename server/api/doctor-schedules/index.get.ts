export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    const { data, error } = await admin
        .from('doctor_schedules')
        .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            max_patients,
            is_active,
            doctor:doctors(id, full_name, department:departments(id, name))
        `)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time')

    if (error) throw createError({ statusCode: 500, message: error.message })

    const schedules = (data ?? []).map((s: any) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        day_name: DAY_NAMES[s.day_of_week],
        start_time: s.start_time,
        end_time: s.end_time,
        max_patients: s.max_patients,
        is_active: s.is_active,
        doctor_id: s.doctor?.id ?? null,
        doctor_name: s.doctor?.full_name ?? '-',
        department_id: s.doctor?.department?.id ?? null,
        department_name: s.doctor?.department?.name ?? '-',
    }))

    return { schedules }
})