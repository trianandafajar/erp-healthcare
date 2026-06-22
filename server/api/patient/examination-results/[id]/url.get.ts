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

  const { data, error } = await admin
    .from('medical_record_files')
    .select(`
      id,
      file_name,
      file_url,
      category,
      created_at,
      medical_record_id,
      medical_records!inner (
        patient_id
      )
    `)
    .eq('medical_records.patient_id', patient.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  const mapped = (data ?? []).map((f: any) => ({
    id: f.id,
    date: f.created_at,
    type: f.category ?? 'Examination Result',
    doctor: '-',
    status: f.category === 'ready' ? 'Ready' : 'Pending',
    fileName: f.file_name,
    department: f.category ?? '-',
    summary: '-',
    requestedBy: '-',
    notes: '-',
  }))

  return { examinationResults: mapped }
})