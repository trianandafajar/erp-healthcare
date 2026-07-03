import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: doctorProfile } = await admin
        .from('doctors')
        .select('department_id')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()

    const departmentId = doctorProfile?.department_id ?? null

    let query = admin
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
            from_doctor:from_doctor_id (
                id,
                profiles (
                    full_name
                )
            ),
            departments:to_department_id (
                name,
                code
            ),
            appointments:new_appointment_id (
                appointment_date,
                status
            )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (departmentId) {
        query = query.or(`to_doctor_id.eq.${user.id},and(to_doctor_id.is.null,to_department_id.eq.${departmentId})`)
    } else {
        query = query.eq('to_doctor_id', user.id)
    }

    const { data, error } = await query.returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map((r) => ({
        id: r.id,
        reason: r.reason,
        notes: r.notes,
        status: r.status,
        created_at: r.created_at,
        patient_name: r.patients?.full_name ?? '-',
        medical_record_number: r.patients?.medical_record_number ?? '-',
        from_doctor_name: r.from_doctor?.profiles?.full_name ?? '-',
        department_name: r.departments?.name ?? '-',
        appointment_date: r.appointments?.appointment_date ?? null,
        appointment_status: r.appointments?.status ?? null,
    }))

    return { referrals: result }
})