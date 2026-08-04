import { supabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event: any) => {
    const token = getRouterParam(event, 'token')
    if (!token) throw createError({ statusCode: 400, message: 'Token is required' })

    const admin = supabaseAdmin()

    const { data: settings, error: settingsError } = await admin
        .from('tenant_settings')
        .select('tenant_id, public_booking_enabled')
        .eq('public_booking_token', token)
        .maybeSingle()

    if (settingsError) throw createError({ statusCode: 500, message: settingsError.message })
    if (!settings || !settings.public_booking_enabled || !settings.tenant_id) {
        throw createError({ statusCode: 404, message: 'Public booking page not found or disabled' })
    }

    const tenantId = settings.tenant_id

    const [tenantRes, tenantSettingsRes, openingHoursRes, holidaysRes, doctorsRes] =
        await Promise.all([
            admin.from('tenants').select('id, name, slug, brand_color').eq('id', tenantId).single(),
            admin.from('tenant_settings').select('display_name, logo_url').eq('tenant_id', tenantId).maybeSingle(),
            admin.from('public_booking_opening_hours').select('*').eq('tenant_id', tenantId).order('day_of_week', { ascending: true }),
            admin.from('public_booking_holidays').select('*').eq('tenant_id', tenantId).order('holiday_date', { ascending: true }),
            admin
                .from('doctors')
                .select(`
                    id,
                    specialization,
                    department_id,
                    profile:profiles(full_name, avatar_url),
                    department:departments(name)
                `)
                .eq('tenant_id', tenantId)
                .eq('is_available', true)
                .order('created_at', { ascending: true })
                .returns<any[]>(),
        ])

    for (const res of [tenantRes, tenantSettingsRes, openingHoursRes, holidaysRes, doctorsRes]) {
        if (res.error) throw createError({ statusCode: 500, message: res.error.message })
    }

    const tenant = tenantRes.data
    const tenantSettings = tenantSettingsRes.data
    const openingHours = openingHoursRes.data
    const holidays = holidaysRes.data
    const allDoctors = doctorsRes.data ?? []

    const doctorIds = allDoctors.map((d: any) => d.id)
    let enabledDoctorIdSet: Set<string> | null = null
    if (doctorIds.length) {
        const { data: enabledSchedules } = await admin
            .from('doctor_schedules')
            .select('doctor_id')
            .in('doctor_id', doctorIds)
            .eq('public_booking_enabled', true)
        const uniqueIds = new Set<string>()
        for (const row of enabledSchedules ?? []) uniqueIds.add(row.doctor_id)
        enabledDoctorIdSet = uniqueIds
    }

    const doctors = allDoctors.filter((d: any) => enabledDoctorIdSet?.has(d.id) ?? false)

    return {
        tenant: {
            id: tenant?.id,
            name: tenant?.name ?? 'Healthcare',
            slug: tenant?.slug,
            brand_color: tenant?.brand_color ?? '#176D37',
            display_name: tenantSettings?.display_name ?? tenant?.name ?? 'Healthcare',
            logo_url: tenantSettings?.logo_url ?? null,
        },
        opening_hours: openingHours ?? [],
        holidays: holidays ?? [],
        doctors: (doctors ?? []).map((d: any) => ({
            id: d.id,
            full_name: d.profile?.full_name ?? 'Doctor',
            specialization: d.specialization ?? null,
            department_id: d.department_id ?? null,
            department_name: d.department?.name ?? null,
            photo_url: d.profile?.avatar_url ?? null,
        })),
    }
})
