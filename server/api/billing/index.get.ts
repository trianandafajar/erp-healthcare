export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('billing')
        .select(`
            id,
            invoice_number,
            service_name,
            department,
            amount,
            status,
            payment_method,
            service_date,
            paid_at,
            created_at,
            patients (  
                full_name,
                medical_record_number
            )
        `)
        .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 400, message: error.message })

    return (data ?? []).map((r: any) => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        patientName: r.patients?.full_name ?? '-',
        medicalRecordNumber: r.patients?.medical_record_number ?? '-',
        serviceName: r.service_name,
        department: r.department,
        amount: r.amount,
        status: r.status,
        paymentMethod: r.payment_method ?? '-',
        serviceDate: r.service_date,
        paidAt: r.paid_at,
    }))
})