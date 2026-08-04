import { supabaseAdmin } from '~~/server/utils/supabase'

const SLOT_MINUTES = 30

function toMinutes(timeStr: string | null | undefined): number {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    return Number(parts[0]) * 60 + Number(parts[1])
}

function toTimeStr(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

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
    const todayStr = new Date().toISOString().split('T')[0]
    const isToday = date === todayStr

    // 1. Holiday check
    const { data: holiday } = await admin
        .from('public_booking_holidays')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('holiday_date', date)
        .maybeSingle()

    if (holiday) return { date, slots: [] }

    // 2. Opening hours for that day
    const { data: openingHour } = await admin
        .from('public_booking_opening_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle()

    if (!openingHour) return { date, slots: [] }

    // 3. Doctor exists and allows public booking
    const { data: doctor } = await admin
        .from('doctors')
        .select('id, department_id')
        .eq('id', doctorId)
        .eq('tenant_id', tenantId)
        .eq('is_public_booking', true)
        .eq('is_available', true)
        .maybeSingle()

    if (!doctor) {
        throw createError({ statusCode: 404, message: 'Doctor not available for public booking' })
    }

    // 4. Doctor schedule for that day
    const { data: schedule } = await admin
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle()

    if (!schedule) return { date, slots: [] }

    // 5. Effective window: max(start) / min(end) of opening hours & doctor schedule
    const startMin = Math.max(
        toMinutes(openingHour.start_time),
        toMinutes(schedule.public_booking_start ?? schedule.start_time),
    )
    const endMin = Math.min(
        toMinutes(openingHour.end_time),
        toMinutes(schedule.public_booking_end ?? schedule.end_time),
    )

    if (endMin <= startMin) return { date, slots: [] }

    // 6. Count existing bookings per time slot
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

    const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1
    const maxPatients = schedule.max_patients ?? 20

    // 7. Generate 30-minute slots
    const slots: string[] = []
    for (let t = startMin; t + SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
        const timeStr = toTimeStr(t)
        if (isToday && t <= nowMin) continue
        if ((bookedByTime[timeStr] ?? 0) >= maxPatients) continue
        slots.push(timeStr)
    }

    return { date, slots }
})
