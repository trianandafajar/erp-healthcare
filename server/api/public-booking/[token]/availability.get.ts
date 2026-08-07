import { supabaseAdmin } from '~~/server/utils/supabase'
import { nowInTz } from '~~/server/utils/publicBooking'

function toMinutes(timeStr: string | null | undefined): number {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    return Number(parts[0]) * 60 + Number(parts[1])
}

function pad(n: number): string {
    return String(n).padStart(2, '0')
}

export default defineEventHandler(async (event: any) => {
    const token = getRouterParam(event, 'token')
    if (!token) throw createError({ statusCode: 400, message: 'Token is required' })

    const query = getQuery(event)
    const month = typeof query.month === 'string' ? query.month : ''

    if (!/^\d{4}-\d{2}$/.test(month)) {
        throw createError({ statusCode: 400, message: 'Invalid month. Expected YYYY-MM.' })
    }

    const [yearStr, monthStr] = month.split('-')
    const year = Number(yearStr)
    const monthIdx = Number(monthStr) - 1
    const monthStartKey = `${year}-${pad(monthIdx + 1)}-01`
    const monthEndKey = `${monthIdx === 11 ? year + 1 : year}-${pad((monthIdx + 1) % 12 + 1)}-01`

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

    const { data: holidays, error: holidaysError } = await admin
        .from('public_booking_holidays')
        .select('holiday_date')
        .eq('tenant_id', tenantId)
        .gte('holiday_date', monthStartKey)
        .lt('holiday_date', monthEndKey)

    if (holidaysError) throw createError({ statusCode: 500, message: holidaysError.message })

    const { data: openingHours, error: openingError } = await admin
        .from('public_booking_opening_hours')
        .select('day_of_week, start_time, end_time')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

    if (openingError) throw createError({ statusCode: 500, message: openingError.message })

    const { data: doctors, error: doctorsError } = await admin
        .from('doctors')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_available', true)

    if (doctorsError) throw createError({ statusCode: 500, message: doctorsError.message })

    const doctorIds = (doctors ?? []).map((d: any) => d.id)

    let schedules: any[] = []
    if (doctorIds.length) {
        const { data, error } = await admin
            .from('doctor_schedules')
            .select('doctor_id, day_of_week, start_time, end_time, public_booking_duration_minutes')
            .in('doctor_id', doctorIds)
            .eq('is_active', true)
            .eq('public_booking_enabled', true)
        if (error) throw createError({ statusCode: 500, message: error.message })
        schedules = data ?? []
    }

    let appointments: any[] = []
    if (doctorIds.length) {
        const { data, error } = await admin
            .from('appointments')
            .select('doctor_id, appointment_date, appointment_time')
            .in('doctor_id', doctorIds)
            .eq('tenant_id', tenantId)
            .gte('appointment_date', monthStartKey)
            .lt('appointment_date', monthEndKey)
            .in('status', ['waiting', 'in_progress'])
        if (error) throw createError({ statusCode: 500, message: error.message })
        appointments = data ?? []
    }

    const holidaySet = new Set((holidays ?? []).map((h: any) => h.holiday_date))
    const openingByDay = new Map<number, any>()
    for (const h of openingHours ?? []) {
        if (h.is_active) openingByDay.set(h.day_of_week, h)
    }
    const schedulesByDoctor = new Map<string, any[]>()
    for (const s of schedules) {
        const list = schedulesByDoctor.get(s.doctor_id) ?? []
        list.push(s)
        schedulesByDoctor.set(s.doctor_id, list)
    }
    const bookedByDateDoctor = new Map<string, Map<string, number>>()
    for (const a of appointments) {
        const key = `${a.appointment_date}|${a.doctor_id}`
        const byTime = bookedByDateDoctor.get(key) ?? new Map<string, number>()
        const t = (a.appointment_time ?? '').slice(0, 5)
        byTime.set(t, (byTime.get(t) ?? 0) + 1)
        bookedByDateDoctor.set(key, byTime)
    }

    const now = nowInTz()
    const todayStr = now.dateKey
    const availableDates: string[] = []

    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${pad(monthIdx + 1)}-${pad(d)}`
        if (dateKey < todayStr) continue
        if (holidaySet.has(dateKey)) continue

        const dow = new Date(year, monthIdx, d).getDay()
        const openingHour = openingByDay.get(dow)
        if (!openingHour) continue

        let hasSlot = false
        for (const doctorId of doctorIds) {
            const doctorSchedules = schedulesByDoctor.get(doctorId) ?? []
            const schedule = doctorSchedules.find((s: any) => s.day_of_week === dow)
            if (!schedule) continue

            const duration = schedule.public_booking_duration_minutes
            if (!duration || duration < 5) continue

            const startMin = Math.max(toMinutes(openingHour.start_time), toMinutes(schedule.start_time))
            const endMin = Math.min(toMinutes(openingHour.end_time), toMinutes(schedule.end_time))
            if (endMin <= startMin) continue

            const booked = bookedByDateDoctor.get(`${dateKey}|${doctorId}`) ?? new Map<string, number>()
            const isToday = dateKey === todayStr
            const nowMin = isToday ? now.minutes : -1

            for (let t = startMin; t + duration <= endMin; t += duration) {
                if (isToday && t <= nowMin) continue
                const timeStr = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
                if ((booked.get(timeStr) ?? 0) >= 1) continue
                hasSlot = true
                break
            }
            if (hasSlot) break
        }
        if (hasSlot) availableDates.push(dateKey)
    }

    return { month, availableDates }
})
