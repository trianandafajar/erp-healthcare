export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: patient, error: patientError } = await admin
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

    if (patientError || !patient) throw createError({ statusCode: 404, message: 'Patient not found' })

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
            paid_at
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 400, message: error.message })

    return {
        payments: (data ?? []).map((r: any) => ({
            id: r.id,
            invoiceNumber: r.invoice_number,
            serviceName: r.service_name,
            department: r.department,
            amount: r.amount,
            status: r.status,
            paymentMethod: r.payment_method ?? '-',
            serviceDate: r.service_date,
            paidAt: r.paid_at,
        }))
    }
})