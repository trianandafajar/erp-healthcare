import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'billing')
    const admin = supabaseAdmin()
    const body = await readBodyObject(event)

    requireFields(body, ['patientId', 'serviceName', 'amount'])

    checkFormat(isUUID(body.patientId), 'patientId', 'UUID')
    if (body.medicalRecordId !== undefined && body.medicalRecordId !== null) {
        checkFormat(isUUID(body.medicalRecordId), 'medicalRecordId', 'UUID')
    }

    const amount = toRequiredNumber(body.amount, 'amount')
    checkField(amount >= 0, 'Amount must be a non-negative number')

    const invoiceNumber = `INV-${Date.now()}`

    const { data, error } = await admin
        .from('billing')
        .insert({
            patient_id: body.patientId,
            medical_record_id: body.medicalRecordId ?? null,
            invoice_number: invoiceNumber,
            service_name: body.serviceName,
            department: body.department,
            amount,
            status: 'Pending',
            payment_method: body.paymentMethod,
            service_date: body.serviceDate ?? new Date().toISOString(),
        })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    return data
})