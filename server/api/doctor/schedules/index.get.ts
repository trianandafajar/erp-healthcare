import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: doctor, error: doctorError } = await admin
        .from('doctors')
        .select('id')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    if (doctorError || !doctor) {
        throw createError({ statusCode: 404, message: 'Doctor profile not found' })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await admin
        .from('doctor_schedules')
        .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            max_patients,
            is_active,
            public_booking_start,
            public_booking_end,
            created_at
        `)
        .eq('doctor_id', doctor.id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { doctor_schedules: data }
})