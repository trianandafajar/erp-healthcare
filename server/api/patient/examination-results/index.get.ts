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
      notes,
      diagnosis,
      treatment_plan,
      doctors!inner (
        profiles!inner (
          full_name
        )
      ),
      appointments!inner (
        departments (
          name
        )
      ),
      medical_record_files (
        id,
        file_name,
        category
      )
    `)
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  const mapped = (records ?? []).map((r: any) => {
    const firstFile = r.medical_record_files?.[0]
    const hasFile = !!firstFile

    return {
      id: r.id,
      date: r.created_at,
      type: r.diagnosis ?? 'Medical Record',
      doctor: r.doctors?.profiles?.full_name ?? '-',
      status: hasFile ? 'Ready' : 'Pending',
      fileName: firstFile?.file_name ?? '-',
      department: r.appointments?.departments?.name ?? '-',
      summary: r.treatment_plan ?? r.diagnosis ?? '-',
      requestedBy: r.doctors?.profiles?.full_name ?? '-',
      notes: r.notes ?? '-',
    }
  })

  return { examinationResults: mapped }
})