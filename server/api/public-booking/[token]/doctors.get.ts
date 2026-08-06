import { supabaseAdmin } from '~~/server/utils/supabase'
import { toMinutes, computeDoctorSlots } from '~~/server/utils/publicBooking'

export default defineEventHandler(async (event: any) => {
    const token = getRouterParam(event, 'token')
    if (!token) throw createError({ statusCode: 400, message: 'Token is required' })

    const query = getQuery(event)
    const date = typeof query.date === 'string' ? query.date : ''

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw createError({ statusCode: 400, message: 'Invalid date. Expected YYYY-MM-DD.' })
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
    const todayStr = new Date().toISOString().split('T')[0]
    const isToday = date === todayStr

    const { data: holiday, error: holidayError } = await admin
        .from('public_booking_holidays')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('holiday_date', date)
        .maybeSingle()

    if (holidayError) throw createError({ statusCode: 500, message: holidayError.message })
    if (holiday) return { date, doctors: [] }

    const { data: openingHour, error: openingError } = await admin
        .from('public_booking_opening_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle()

    if (openingError) throw createError({ statusCode: 500, message: openingError.message })
    if (!openingHour) return { date, doctors: [] }

    const { data: doctors, error: doctorsError } = await admin
        .from('doctors')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .returns<{ id: string }[]>()

    if (doctorsError) throw createError({ statusCode: 500, message: doctorsError.message })

    const doctorIds = (doctors ?? []).map((d) => d.id)
    if (!doctorIds.length) return { date, doctors: [] }

    const { data: schedules, error: schedulesError } = await admin
        .from('doctor_schedules')
        .select('doctor_id, start_time, end_time, max_patients, public_booking_duration_minutes')
        .in('doctor_id', doctorIds)
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .eq('public_booking_enabled', true)

    if (schedulesError) throw createError({ statusCode: 500, message: schedulesError.message })
    if (!schedules?.length) return { date, doctors: [] }

    const scheduleDoctorIds = schedules.map((s: any) => s.doctor_id)

    const { data: appointments, error: appointmentsError } = await admin
        .from('appointments')
        .select('doctor_id, appointment_time')
        .in('doctor_id', scheduleDoctorIds)
        .eq('tenant_id', tenantId)
        .eq('appointment_date', date)
        .in('status', ['waiting', 'in_progress'])
        .returns<{ doctor_id: string; appointment_time: string }[]>()

    if (appointmentsError) throw createError({ statusCode: 500, message: appointmentsError.message })

    const bookedByDoctor = new Map<string, Record<string, number>>()
    for (const appt of appointments ?? []) {
        const map = bookedByDoctor.get(appt.doctor_id) ?? {}
        const key = (appt.appointment_time ?? '').slice(0, 5)
        map[key] = (map[key] ?? 0) + 1
        bookedByDoctor.set(appt.doctor_id, map)
    }

    const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1

    const result: { id: string; slots: string[] }[] = []
    for (const schedule of schedules) {
        const duration = schedule.public_booking_duration_minutes
        if (!duration || duration < 5) continue

        const startMin = Math.max(toMinutes(openingHour.start_time), toMinutes(schedule.start_time))
        const endMin = Math.min(toMinutes(openingHour.end_time), toMinutes(schedule.end_time))
        if (endMin <= startMin) continue

        const slots = computeDoctorSlots({
            startMin,
            endMin,
            duration,
            maxPatients: schedule.max_patients ?? 20,
            bookedByTime: bookedByDoctor.get(schedule.doctor_id) ?? {},
            isToday,
            nowMin,
        })

        if (slots.length) {
            result.push({ id: schedule.doctor_id, slots })
        }
    }

    return { date, doctors: result }
})
