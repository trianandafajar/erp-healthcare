import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const query = getQuery(event)
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)
    const search = query.search as string | undefined
    const gender = query.gender as string | undefined
    const bloodType = query.bloodType as string | undefined
    const account = query.account as string | undefined

    let q = admin
        .from('patients')
        .select(`
        id,
        medical_record_number,
        profile_id,
        full_name,
        date_of_birth,
        gender,
        phone,
        address,
        blood_type,
        created_at,
        updated_at,
        profiles (
            email,
            status
        )
    `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (search) {
        q = q.or(
            `full_name.ilike.%${search}%,` +
            `medical_record_number.ilike.%${search}%,` +
            `phone.ilike.%${search}%`
        )
    }

    if (gender && gender !== 'all') {
        q = q.eq('gender', gender)
    }

    if (bloodType && bloodType !== 'all') {
        q = q.eq('blood_type', bloodType)
    }

    if (account === 'registered') {
        q = q.not('profile_id', 'is', null)
    } else if (account === 'walkin') {
        q = q.is('profile_id', null)
    }

    const from = (page - 1) * limit
    q = q.range(from, from + limit - 1)

    const { data, error, count } = await q

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = (data ?? []).map(p => ({
        ...p,
        email: p.profiles?.email ?? null,
        has_account: !!p.profile_id,
        profiles: undefined
    }))

    return {
        patients: result,
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
    }
})