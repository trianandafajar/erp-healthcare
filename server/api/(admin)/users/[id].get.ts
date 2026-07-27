import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const userId = getRouterParam(event, 'id')
    if (!userId) throw createError({ statusCode: 400, message: 'User ID is required' })

    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            status,
            created_at,
            updated_at,
            user_roles (
                roles (
                    name,
                    label
                )
            )
        `)
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .single()
        .returns<any>()

    if (profileError || !profile) {
        throw createError({ statusCode: 404, message: 'User not found' })
    }

    const role = profile.user_roles?.[0]?.roles?.name ?? null

    let departmentId: string | null = null
    let specialization: string | null = null
    let strNumber: string | null = null
    let sipNumber: string | null = null
    let phone: string | null = null
    let biography: string | null = null
    let experienceYears: number | null = null
    let consultationFee: number | null = null
    let isAvailable: boolean | null = null
    let dateOfBirth: string | null = null
    let gender: string | null = null
    let bloodType: string | null = null
    let address: string | null = null
    let room: string | null = null

    if (role === 'doctor') {
        const { data: doctor } = await admin
            .from('doctors')
            .select('*')
            .eq('id', userId)
            .single()
            .returns<any>()

        if (doctor) {
            departmentId = doctor.department_id
            specialization = doctor.specialization
            strNumber = doctor.str_number
            sipNumber = doctor.sip_number
            phone = doctor.phone
            biography = doctor.biography
            experienceYears = doctor.experience_years
            consultationFee = doctor.consultation_fee
            isAvailable = doctor.is_available
        }
    }

    if (role === 'nurse') {
        const { data: nurse } = await admin
            .from('nurses')
            .select('*')
            .eq('id', userId)
            .single()
            .returns<any>()

        if (nurse) {
            departmentId = nurse.department_id
            phone = nurse.phone
            experienceYears = nurse.experience_years
            isAvailable = nurse.is_available
        }
    }

    if (role === 'patient') {
        const { data: patient } = await admin
            .from('patients')
            .select('*')
            .eq('profile_id', userId)
            .single()
            .returns<any>()

        if (patient) {
            dateOfBirth = patient.date_of_birth
            gender = patient.gender
            phone = patient.phone
            bloodType = patient.blood_type
            address = patient.address
            room = patient.room
        }
    }

    return {
        id: profile.id,
        name: profile.full_name,
        full_name: profile.full_name,
        email: profile.email,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        role,
        role_label: profile.user_roles?.[0]?.roles?.label ?? null,
        department_id: departmentId,
        specialization,
        str_number: strNumber,
        sip_number: sipNumber,
        phone,
        biography,
        experience_years: experienceYears,
        consultation_fee: consultationFee,
        is_available: isAvailable,
        date_of_birth: dateOfBirth,
        gender,
        blood_type: bloodType,
        address,
        room,
    }
})
