export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('doctors')
        .select(`
            id,
            specialization,
            str_number,
            sip_number,
            phone,
            photo_url,
            biography,
            experience_years,
            consultation_fee,
            is_available,
            created_at,
            updated_at,
            profiles (
                full_name,
                email,
                status
            ),
            departments (
                id,
                name,
                code
            )
        `)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map(d => ({
        ...d,
        full_name: d.profiles?.full_name ?? null,
        email: d.profiles?.email ?? null,
        status: d.profiles?.status ?? null,
        department: d.departments,
        profiles: undefined,
        departments: undefined
    }))

    return { doctors: result }
})