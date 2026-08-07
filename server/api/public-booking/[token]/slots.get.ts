import { supabaseAdmin } from '~~/server/utils/supabase'
import { toMinutes, computeDoctorSlots, nowInTz } from '~~/server/utils/publicBooking'

export default defineEventHandler(async (event: any) => {
    const token = getRouterParam(event, 'token')
    if (!token) throw createError({ statusCode: 400, message: 'Token is required' })

    const query = getQuery(event)
    const date = typeof query.date === 'string' ? query.date : ''
    const doctorId = typeof query.doctor_id === 'string' ? query.doctor_id : ''

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw createError({ statusCode: 400, message: 'Invalid date. Expected YYYY-MM-DD.' })
    }
    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'doctor_id is required' })
    }

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
    const parsedDate = new Date(date + 'T00:00:00')
    if (Number.isNaN(parsedDate.getTime())) {
        throw createError({ statusCode: 400, message: 'Invalid date' })
    }
    const dayOfWeek = parsedDate.getDay()
    const now = nowInTz()
    const isToday = date === now.dateKey

    const { data: holiday, error: holidayError } = await admin
        .from('public_booking_holidays')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('holiday_date', date)
        .maybeSingle()

    if (holidayError) throw createError({ statusCode: 500, message: holidayError.message })
    if (holiday) return { date, slots: [] }

    const { data: openingHour, error: openingError } = await admin
        .from('public_booking_opening_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle()

    if (openingError) throw createError({ statusCode: 500, message: openingError.message })
    if (!openingHour) return { date, slots: [] }

    const { data: doctor, error: doctorError } = await admin
        .from('doctors')
        .select('id, department_id')
        .eq('id', doctorId)
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .maybeSingle()

    if (doctorError) throw createError({ statusCode: 500, message: doctorError.message })
    if (!doctor) {
        throw createError({ statusCode: 404, message: 'Doctor not available for public booking' })
    }

    const { data: schedule, error: scheduleError } = await admin
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .eq('public_booking_enabled', true)
        .maybeSingle()

    if (scheduleError) throw createError({ statusCode: 500, message: scheduleError.message })
    if (!schedule) return { date, slots: [] }

    const duration = schedule.public_booking_duration_minutes
    if (!duration || duration < 5) return { date, slots: [] }

    const startMin = Math.max(toMinutes(openingHour.start_time), toMinutes(schedule.start_time))
    const endMin = Math.min(toMinutes(openingHour.end_time), toMinutes(schedule.end_time))

    if (endMin <= startMin) return { date, slots: [] }

    const { data: appointments } = await admin
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', doctorId)
        .eq('tenant_id', tenantId)
        .eq('appointment_date', date)
        .in('status', ['waiting', 'in_progress'])
        .returns<{ appointment_time: string }[]>()

    const bookedByTime: Record<string, number> = {}
    for (const appt of appointments ?? []) {
        const key = (appt.appointment_time ?? '').slice(0, 5)
        bookedByTime[key] = (bookedByTime[key] ?? 0) + 1
    }

    const nowMin = isToday ? now.minutes : -1

    const slots = computeDoctorSlots({
        startMin,
        endMin,
        duration,
        bookedByTime,
        isToday,
        nowMin,
    })

    return { date, slots }
})
