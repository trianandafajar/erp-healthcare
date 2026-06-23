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
        doctor:doctors(
            id,
            specialization,
            profile:profiles(id, full_name),
            department:departments(id, name)
        )
    `)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time')

    if (error) throw createError({ statusCode: 500, message: error.message })

    // hitung booked per schedule
    const today = new Date().toISOString().slice(0, 10)
    const { data: bookedData } = await admin
        .from('appointments')
        .select('doctor_id, appointment_date')
        .in('status', ['waiting', 'in_progress'])
        .gte('appointment_date', today)

    const bookedMap: Record<string, number> = {}
    for (const appt of bookedData ?? []) {
        const dow = new Date(appt.appointment_date).getDay()
        const key = `${appt.doctor_id}_${dow}`
        bookedMap[key] = (bookedMap[key] ?? 0) + 1
    }

    const schedules = (data ?? []).map((s: any) => {
        const key = `${s.doctor?.id}_${s.day_of_week}`
        const booked = bookedMap[key] ?? 0
        const remaining = Math.max(0, (s.max_patients ?? 0) - booked)
        return {
            id: s.id,
            day_of_week: s.day_of_week,
            day_name: DAY_NAMES[s.day_of_week],
            start_time: s.start_time,
            end_time: s.end_time,
            max_patients: s.max_patients,
            booked,
            remaining_slots: remaining,
            is_active: s.is_active,
            doctor_id: s.doctor?.id ?? null,
            doctor_name: s.doctor?.profile?.full_name ?? '-',
            specialization: s.doctor?.specialization ?? '-',
            department_id: s.doctor?.department?.id ?? null,
            department_name: s.doctor?.department?.name ?? '-',
        }
    })

    return { schedules }
})