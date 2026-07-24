import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'billing')
    const admin = supabaseAdmin()
    const body = await readBody(event)

    const invoiceNumber = `INV-${Date.now()}`

    const { data, error } = await admin
        .from('billing')
        .insert({
            patient_id: body.patientId,
            medical_record_id: body.medicalRecordId,
            invoice_number: invoiceNumber,
            service_name: body.serviceName,
            department: body.department,
            amount: body.amount != null ? Number(body.amount) : 0,
            status: 'Pending',
            payment_method: body.paymentMethod,
            service_date: body.serviceDate ?? new Date().toISOString(),
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return data
})