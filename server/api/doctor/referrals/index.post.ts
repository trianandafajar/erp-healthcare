import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const {
        medical_record_id,
        patient_id,
        from_doctor_id,
        to_department_id,
        to_doctor_id,
        reason,
        notes
    } = await readBody(event)

    if (!medical_record_id || !patient_id || !from_doctor_id || !to_department_id || !reason) {
        throw createError({
            statusCode: 400,
            message: 'medical_record_id, patient_id, from_doctor_id, to_department_id, and reason are required'
        })
    }

    const { admin, tenantId } = await getTenantContext(event)

    const today = new Date().toISOString().split('T')[0]

    const { data: appointment, error: appointmentError } = await admin
        .from('appointments')
        .insert({
            patient_id,
            doctor_id: to_doctor_id ?? null,
            department_id: to_department_id,
            appointment_date: today,
            type: 'referral',
            status: 'waiting',
            chief_complaint: reason,
            tenant_id: tenantId,
        })
        .select()
        .single()

    if (appointmentError) {
        throw createError({ statusCode: 400, message: appointmentError.message })
    }

    const { data: referral, error: referralError } = await admin
        .from('referrals')
        .insert({
            medical_record_id,
            patient_id,
            from_doctor_id,
            to_department_id,
            to_doctor_id: to_doctor_id ?? null,
            new_appointment_id: appointment.id,
            reason,
            notes,
            status: 'pending',
            tenant_id: tenantId,
        })
        .select()
        .single()

    if (referralError) {
        await admin.from('appointments').delete().eq('id', appointment.id)
        throw createError({ statusCode: 400, message: referralError.message })
    }

    return { referral, appointment }
})