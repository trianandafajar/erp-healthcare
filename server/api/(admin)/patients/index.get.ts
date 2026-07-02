import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

    const { data, error } = await admin
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
    `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map(p => ({
        ...p,
        email: p.profiles?.email ?? null,
        has_account: !!p.profile_id,
        profiles: undefined
    }))

    return { patients: result }
})