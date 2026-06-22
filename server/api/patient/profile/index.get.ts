export default defineEventHandler(async (event) => {
  const supabase = serverSupabase(event)
  const admin = supabaseAdmin()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // patients.profile_id == user.id (see patients select_own policy & patient appointments endpoint)
  const { data: patient, error: patientError } = await admin
    .from('patients')
    .select(
      `
      id,
      profile_id,
      full_name,
      medical_record_number,
      date_of_birth,
      gender,
      phone,
      address,
      blood_type,
      profiles (
        email,
        status
      )
    `
    )
    .eq('profile_id', user.id)
    .single()
    .returns<{
      id: string
      profile_id: string
      full_name: string
      medical_record_number: string
      date_of_birth: string | null
      gender: string | null
      phone: string | null
      address: string | null
      blood_type: string | null
      profiles: { email: string | null; status: string } | null
    }>()

  if (patientError || !patient) {
    throw createError({
      statusCode: 404,
      message: 'Patient profile not found'
    })
  }

  return {
    profile: {
      fullName: patient.full_name ?? '-',
      medicalRecordNumber: patient.medical_record_number ?? '-',
      email: patient.profiles?.email ?? user.email ?? '-',
      phone: patient.phone ?? '-',
      gender: (patient.gender ?? '-')
        .toString()
        .replace(/^([a-z])/i, (m) => m.toUpperCase()),
      dateOfBirth: patient.date_of_birth
        ? new Date(patient.date_of_birth).toISOString()
        : '',
      bloodType: patient.blood_type ?? '-',
      address: patient.address ?? '-',
      status:
        patient.profiles?.status === 'inactive'
          ? 'Inactive'
          : 'Active'
    }
  }
})
