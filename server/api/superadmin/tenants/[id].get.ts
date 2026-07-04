export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const tenantId = getRouterParam(event, 'id')
    if (!tenantId) throw createError({ statusCode: 400, message: 'Tenant ID is required' })

    const admin = supabaseAdmin()

    // Tenant base data
    const { data: tenant, error: tenantError } = await admin
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

    if (tenantError || !tenant) {
        throw createError({ statusCode: 404, message: 'Tenant not found' })
    }

    // Owner profile (from profiles table, not auth.users directly)
    const { data: ownerProfile } = await admin
        .from('profiles')
        .select('id, full_name, email, status, created_at, avatar_url')
        .eq('id', tenant.owner_id)
        .single()

    // All stats in parallel
    const [
        { count: userCount },
        { count: doctorCount },
        { count: nurseCount },
        { count: patientCount },
        { count: departmentCount },
        { count: appointmentCount },
        { count: medicalRecordCount },
        { count: prescriptionCount },
        { count: billingCount },
        { data: billingTotals },
    ] = await Promise.all([
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('doctors').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('nurses').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('patients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('departments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('medical_records').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('prescriptions').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('billing').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        // Billing totals: sum of paid invoices
        admin.from('billing').select('amount, status').eq('tenant_id', tenantId),
    ])

    const totalRevenue = (billingTotals ?? [])
        .filter((b: any) => b.status === 'Paid')
        .reduce((sum: number, b: any) => sum + Number(b.amount), 0)

    const pendingRevenue = (billingTotals ?? [])
        .filter((b: any) => b.status === 'Pending')
        .reduce((sum: number, b: any) => sum + Number(b.amount), 0)

    // Recent activity logs for this tenant
    const { data: recentActivity } = await admin
        .from('activity_logs')
        .select('id, action, module, description, created_at, actor_id, profiles(full_name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10)
        .returns<any[]>()

    // Recent appointments
    const { data: recentAppointments } = await admin
        .from('appointments')
        .select(`
            id, appointment_date, type, status, chief_complaint, created_at,
            patients ( full_name, medical_record_number ),
            doctors ( profiles ( full_name ) ),
            departments ( name )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<any[]>()

    // Appointment status breakdown
    const { data: appointmentBreakdown } = await admin
        .from('appointments')
        .select('status')
        .eq('tenant_id', tenantId)
        .returns<any[]>()

    const appointmentStats = {
        waiting: 0,
        in_progress: 0,
        done: 0,
        cancelled: 0,
    }
    appointmentBreakdown?.forEach((a: any) => {
        if (a.status in appointmentStats) {
            appointmentStats[a.status as keyof typeof appointmentStats]++
        }
    })

    return {
        // Tenant info
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscription_plan: tenant.subscription_plan,
        subscription_status: tenant.subscription_status,
        created_at: tenant.created_at,

        // Owner
        owner: ownerProfile ?? null,

        // Stats
        stats: {
            users: userCount ?? 0,
            doctors: doctorCount ?? 0,
            nurses: nurseCount ?? 0,
            patients: patientCount ?? 0,
            departments: departmentCount ?? 0,
            appointments: appointmentCount ?? 0,
            medical_records: medicalRecordCount ?? 0,
            prescriptions: prescriptionCount ?? 0,
            billing: billingCount ?? 0,
            total_revenue: totalRevenue,
            pending_revenue: pendingRevenue,
        },

        // Appointment breakdown by status
        appointment_breakdown: appointmentStats,

        // Recent data
        recent_activity: (recentActivity ?? []).map((a: any) => ({
            id: a.id,
            action: a.action,
            module: a.module,
            description: a.description,
            created_at: a.created_at,
            actor_name: a.profiles?.full_name ?? a.profiles?.email ?? 'System',
        })),

        recent_appointments: (recentAppointments ?? []).map((a: any) => ({
            id: a.id,
            date: a.appointment_date,
            type: a.type,
            status: a.status,
            chief_complaint: a.chief_complaint,
            patient_name: a.patients?.full_name ?? '-',
            medical_record_number: a.patients?.medical_record_number ?? '-',
            doctor_name: a.doctors?.profiles?.full_name ?? '-',
            department_name: a.departments?.name ?? '-',
        })),
    }
})