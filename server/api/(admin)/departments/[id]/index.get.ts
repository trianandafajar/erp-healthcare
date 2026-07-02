import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {

    const { admin, tenantId } = await getTenantContext(event)
    const departmentId = getRouterParam(event, 'id')

    if (!departmentId) throw createError({ statusCode: 400, message: 'Department ID is required' })

    const [
        { data: department, error: deptError },
        { data: doctors, error: doctorError },
        { data: appointments, error: apptError },
    ] = await Promise.all([
        admin
            .from('departments')
            .select('id, name, code, description, created_at, updated_at')
            .eq('id', departmentId)
            .eq('tenant_id', tenantId)
            .single()
            .returns<any>(),

        admin
            .from('doctors')
            .select(`
                id,
                specialization,
                phone,
                experience_years,
                consultation_fee,
                is_available,
                profiles ( full_name, email, avatar_url, status )
            `)
            .eq('department_id', departmentId)
            .eq('tenant_id', tenantId)
            .returns<any[]>(),

        admin
            .from('appointments')
            .select('id, status, appointment_date, patient_id')
            .eq('department_id', departmentId)
            .eq('tenant_id', tenantId)
            .returns<any[]>(),
    ])

    if (deptError) throw createError({ statusCode: 404, message: 'Department not found' })
    if (doctorError) throw createError({ statusCode: 400, message: doctorError.message })
    if (apptError) throw createError({ statusCode: 400, message: apptError.message })

    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().slice(0, 7)

    const apptList = appointments ?? []
    const doctorList = doctors ?? []

    const stats = {
        total_doctors: doctorList.length,
        available_doctors: doctorList.filter((d) => d.is_available).length,
        total_appointments: apptList.length,
        total_patients: new Set(apptList.map((a) => a.patient_id)).size,
        appointments_today: apptList.filter((a) => a.appointment_date === today).length,
        appointments_this_month: apptList.filter((a) => a.appointment_date?.startsWith(thisMonth)).length,
        completed: apptList.filter((a) => a.status === 'completed').length,
        pending: apptList.filter((a) => a.status === 'pending').length,
        cancelled: apptList.filter((a) => a.status === 'cancelled').length,
        in_progress: apptList.filter((a) => a.status === 'in_progress').length,
    }

    return {
        ...department,
        doctors: doctorList,
        stats,
    }
})