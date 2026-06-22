export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: schedules, error } = await admin
        .from('doctor_schedules')
        .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            max_patients,
            is_active,
            doctor_id,
            doctors!doctor_schedules_doctor_id_fkey (
            id,
            department_id,
            specialization,
            profiles!doctors_id_fkey (full_name),
            departments!doctors_department_id_fkey (
                id,
                name
            )
            )
        `)
        .eq('is_active', true)
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const dayMap: Record<number, string> = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
    }

    return {
        schedules: (schedules ?? []).map((s: any) => ({
            id: s.id,
            day: dayMap[s.day_of_week] ?? String(s.day_of_week),
            time: `${s.start_time} - ${s.end_time}`,
            doctorId: s.doctor_id,
            maxPatients: s.max_patients,
            doctorName: s.doctors?.profiles?.full_name ?? '',
            specialty: s.doctors?.specialization ?? '',
            departmentId: s.doctors?.department_id ?? null,
            departmentName: s.doctors?.departments?.name ?? '',
        }))
    }
})