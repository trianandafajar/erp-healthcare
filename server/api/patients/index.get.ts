export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('patients')
        .select(`
            id,
            medical_record_number,
            full_name,
            date_of_birth,
            gender,
            phone,
            email,
            address,
            blood_type,
            allergies,
            emergency_contact_name,
            emergency_contact_phone,
            insurance_type,
            insurance_number,
            photo_url,
            status,
            created_at,
            updated_at,
            profiles (
                full_name,
                email,
                status
            )
        `)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map(p => ({
        ...p,
        full_name: p.profiles?.full_name ?? p.full_name,
        email: p.profiles?.email ?? p.email,
        profiles: undefined,
    }))

    return { patients: result }
})