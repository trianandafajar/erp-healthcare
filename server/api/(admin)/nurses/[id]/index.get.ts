export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const nurseId = getRouterParam(event, 'id')

    if (!nurseId) throw createError({ statusCode: 400, message: 'Nurse ID is required' })

    const [
        { data: nurse, error: nurseError },
        { data: schedules, error: scheduleError },
        { data: vitalSigns, error: vsError },
        { data: careNotes, error: cnError },
        { data: procedures, error: procError },
    ] = await Promise.all([

        admin
            .from('nurses')
            .select(`
                id,
                phone,
                experience_years,
                is_available,
                created_at,
                updated_at,
                profiles ( full_name, email, avatar_url, status ),
                departments:department_id ( id, name, code )
            `)
            .eq('id', nurseId)
            .single()
            .returns<any>(),

        admin
            .from('nurse_schedules')
            .select('id, day_of_week, start_time, end_time, max_patients, is_active')
            .eq('nurse_id', nurseId)
            .eq('is_active', true)
            .order('day_of_week')
            .returns<any[]>(),

        // Vital signs yang pernah direkam
        admin
            .from('nurse_vital_signs')
            .select('id, patient_id, recorded_at')
            .eq('recorded_by', nurseId)
            .returns<any[]>(),

        // Care notes
        admin
            .from('nurse_care_notes')
            .select('id, patient_id, category, recorded_at')
            .eq('recorded_by', nurseId)
            .returns<any[]>(),

        // Procedures
        admin
            .from('nurse_procedures')
            .select('id, patient_id, status, scheduled_at')
            .eq('recorded_by', nurseId)
            .returns<any[]>(),
    ])

    if (nurseError) throw createError({ statusCode: 404, message: 'Nurse not found' })
    if (scheduleError) throw createError({ statusCode: 400, message: scheduleError.message })
    if (vsError) throw createError({ statusCode: 400, message: vsError.message })
    if (cnError) throw createError({ statusCode: 400, message: cnError.message })
    if (procError) throw createError({ statusCode: 400, message: procError.message })

    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().slice(0, 7)

    const vsList = vitalSigns ?? []
    const cnList = careNotes ?? []
    const procList = procedures ?? []

    const stats = {
        total_patients: new Set([
            ...vsList.map((v) => v.patient_id),
            ...cnList.map((c) => c.patient_id),
            ...procList.map((p) => p.patient_id),
        ]).size,
        total_vital_signs: vsList.length,
        total_care_notes: cnList.length,
        total_procedures: procList.length,
        procedures_pending: procList.filter((p) => p.status === 'pending').length,
        procedures_in_progress: procList.filter((p) => p.status === 'in_progress').length,
        procedures_completed: procList.filter((p) => p.status === 'completed').length,
        vitals_today: vsList.filter((v) => v.recorded_at?.startsWith(today)).length,
        vitals_this_month: vsList.filter((v) => v.recorded_at?.startsWith(thisMonth)).length,
    }

    return {
        ...nurse,
        active_schedules: schedules ?? [],
        stats,
    }
})