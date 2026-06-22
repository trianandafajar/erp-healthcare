export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: patient, error: patientError } = await admin
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

    if (patientError || !patient) {
        throw createError({ statusCode: 404, message: 'Patient profile not found' })
    }

    const { data: records, error } = await admin
        .from('medical_records')
        .select(`
            id,
            created_at,
            diagnosis,
            icd10_code,
            treatment_plan,
            notes,
            subjective,
            objective,
            doctors!inner (
                profiles!inner (
                    full_name
                )
            ),
            appointments!inner (
                departments (
                    name
                )
            )
        `)
        .eq('patient_id', patient.id)
        .not('diagnosis', 'is', null)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    const mapped = (records ?? []).map((r: any) => {
        const subjectiveText: string = r.subjective ?? ''
        const symptoms = subjectiveText
            .split(/[,;\n]+/)
            .map((s: string) => s.trim())
            .filter(Boolean)

        const objectiveText: string = r.objective ?? ''
        const findings = objectiveText
            .split(/\r?\n+/)
            .map((s: string) => s.trim())
            .filter(Boolean)

        const treatmentText: string = r.treatment_plan ?? ''
        const carePlan = treatmentText
            .split(/\r?\n+/)
            .map((s: string) => s.trim())
            .filter(Boolean)

        return {
            id: r.id,
            date: r.created_at,
            doctor: r.doctors?.profiles?.full_name ?? '-',
            diagnosis: r.diagnosis ?? '-',
            code: r.icd10_code ?? '-',
            notes: r.notes ?? '-',
            department: r.appointments?.departments?.name ?? '-',
            severity: 'Low',
            symptoms: symptoms.length ? symptoms : [],
            findings: findings.length ? findings : [],
            carePlan: carePlan.length ? carePlan : [],
            followUp: r.notes ?? '-',
        }
    })

    return { diagnoses: mapped }
})