import { getTenantContext } from '~~/server/utils/getTenantContext'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const body = await readBody(event)
    const { enabled, opening_hours, holidays } = body ?? {}

    const { data: existing, error: existingError } = await admin
        .from('tenant_settings')
        .select('id, public_booking_enabled, public_booking_token')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    if (existingError) throw createError({ statusCode: 500, message: existingError.message })

    let token: string | null = existing?.public_booking_token ?? null

    if (enabled !== undefined) {
        const willEnable = Boolean(enabled)
        if (willEnable && !token) {
            token = randomUUID()
        }
    }

    if (enabled === undefined && opening_hours === undefined && holidays === undefined) {
        throw createError({ statusCode: 400, message: 'No fields to update. Provide enabled, opening_hours, and/or holidays.' })
    }

    const payload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (enabled !== undefined) payload.public_booking_enabled = Boolean(enabled)
    if (token !== null) payload.public_booking_token = token

    if (existing) {
        const { error } = await admin.from('tenant_settings').update(payload).eq('tenant_id', tenantId)
        if (error) throw createError({ statusCode: 500, message: error.message })
    } else {
        const { error } = await admin.from('tenant_settings').insert({ tenant_id: tenantId, ...payload })
        if (error) throw createError({ statusCode: 500, message: error.message })
    }

    if (Array.isArray(opening_hours)) {
        const { error: deleteError } = await admin
            .from('public_booking_opening_hours')
            .delete()
            .eq('tenant_id', tenantId)
        if (deleteError) throw createError({ statusCode: 500, message: deleteError.message })

        const rows = opening_hours
            .filter((h: any) => h?.day_of_week !== undefined && h?.start_time && h?.end_time)
            .map((h: any) => ({
                tenant_id: tenantId,
                day_of_week: Number(h.day_of_week),
                start_time: h.start_time,
                end_time: h.end_time,
                is_active: h.is_active !== false,
            }))

        if (rows.length) {
            const { error: insertError } = await admin.from('public_booking_opening_hours').insert(rows)
            if (insertError) throw createError({ statusCode: 500, message: insertError.message })
        }
    }

    if (Array.isArray(holidays)) {
        const { error: deleteError } = await admin
            .from('public_booking_holidays')
            .delete()
            .eq('tenant_id', tenantId)
        if (deleteError) throw createError({ statusCode: 500, message: deleteError.message })

        const rows = holidays
            .filter((h: any) => h?.holiday_date)
            .map((h: any) => ({
                tenant_id: tenantId,
                holiday_date: h.holiday_date,
                name: h.name ?? null,
            }))

        if (rows.length) {
            const { error: insertError } = await admin.from('public_booking_holidays').insert(rows)
            if (insertError) throw createError({ statusCode: 500, message: insertError.message })
        }
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'public-booking',
        p_entity_id: tenantId,
        p_description: 'Updated public booking configuration',
        p_metadata: {
            enabled: enabled !== undefined ? Boolean(enabled) : existing?.public_booking_enabled,
            opening_hours_count: Array.isArray(opening_hours) ? opening_hours.length : undefined,
            holidays_count: Array.isArray(holidays) ? holidays.length : undefined,
        },
    })

    const [{ data: newSettings }, { data: newHours }, { data: newHolidays }] = await Promise.all([
        admin.from('tenant_settings').select('public_booking_enabled, public_booking_token').eq('tenant_id', tenantId).maybeSingle(),
        admin.from('public_booking_opening_hours').select('*').eq('tenant_id', tenantId).order('day_of_week', { ascending: true }),
        admin.from('public_booking_holidays').select('*').eq('tenant_id', tenantId).order('holiday_date', { ascending: true }),
    ])

    return {
        enabled: newSettings?.public_booking_enabled ?? false,
        token: newSettings?.public_booking_token ?? null,
        opening_hours: newHours ?? [],
        holidays: newHolidays ?? [],
    }
})
