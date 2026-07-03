import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const { data, error } = await admin
        .from('referrals')
        .select(`
            id,
            reason,
            notes,
            status,
            created_at,
            patients (
                full_name,
                medical_record_number
            ),
            departments:to_department_id (
                name,
                code
            ),
            to_doctor:to_doctor_id (
                id,
                profiles (
                    full_name
                )
            ),
            appointments:new_appointment_id (
                appointment_date,
                status
            )
        `)
        .eq('from_doctor_id', user.id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map((r) => ({
        id: r.id,
        reason: r.reason,
        notes: r.notes,
        status: r.status,
        created_at: r.created_at,
        patient_name: r.patients?.full_name ?? '-',
        medical_record_number: r.patients?.medical_record_number ?? '-',
        department_name: r.departments?.name ?? '-',
        department_code: r.departments?.code ?? null,
        to_doctor_name: r.to_doctor?.profiles?.full_name ?? null,
        appointment_date: r.appointments?.appointment_date ?? null,
        appointment_status: r.appointments?.status ?? null,
    }))

    return { referrals: result }
})