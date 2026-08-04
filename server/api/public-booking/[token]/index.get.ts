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

    const [{ data: tenant }, { data: tenantSettings }, { data: openingHours }, { data: holidays }, { data: doctors }] =
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
                    photo_url,
                    profile:profiles(full_name),
                    department:departments(name)
                `)
                .eq('tenant_id', tenantId)
                .eq('is_public_booking', true)
                .eq('is_available', true)
                .order('created_at', { ascending: true })
                .returns<any[]>(),
        ])

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
            photo_url: d.photo_url ?? null,
        })),
    }
})
