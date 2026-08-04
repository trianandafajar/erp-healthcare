import { getTenantContext } from '~~/server/utils/getTenantContext'

export default defineEventHandler(async (event) => {
    const { admin, tenantId } = await getTenantContext(event)

    const [{ data: settings, error: settingsError }, { data: openingHours, error: hoursError }, { data: holidays, error: holidaysError }] =
        await Promise.all([
            admin.from('tenant_settings').select('public_booking_enabled, public_booking_token').eq('tenant_id', tenantId).maybeSingle(),
            admin.from('public_booking_opening_hours').select('*').eq('tenant_id', tenantId).order('day_of_week', { ascending: true }),
            admin.from('public_booking_holidays').select('*').eq('tenant_id', tenantId).order('holiday_date', { ascending: true }),
        ])

    if (settingsError) throw createError({ statusCode: 500, message: settingsError.message })
    if (hoursError) throw createError({ statusCode: 500, message: hoursError.message })
    if (holidaysError) throw createError({ statusCode: 500, message: holidaysError.message })

    return {
        enabled: settings?.public_booking_enabled ?? false,
        token: settings?.public_booking_token ?? null,
        opening_hours: openingHours ?? [],
        holidays: holidays ?? [],
    }
})
