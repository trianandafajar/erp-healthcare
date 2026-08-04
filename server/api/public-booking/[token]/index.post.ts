import { supabaseAdmin } from '~~/server/utils/supabase'
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

const SLOT_MINUTES = 30

function toMinutes(timeStr: string | null | undefined): number {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    return Number(parts[0]) * 60 + Number(parts[1])
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default defineEventHandler(async (event: any) => {
    const token = getRouterParam(event, 'token')
    if (!token) throw createError({ statusCode: 400, message: 'Token is required' })

    const body = await readBody(event)
    const { doctor_id, appointment_date, appointment_time, chief_complaint, patient } = body ?? {}
    const patientData = patient ?? {}

    if (!doctor_id || !appointment_date || !appointment_time) {
        throw createError({ statusCode: 400, message: 'doctor_id, appointment_date, and appointment_time are required' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
        throw createError({ statusCode: 400, message: 'Invalid date. Expected YYYY-MM-DD.' })
    }
    if (!/^\d{2}:\d{2}$/.test(appointment_time)) {
        throw createError({ statusCode: 400, message: 'Invalid time. Expected HH:MM.' })
    }
    if (!patientData.full_name || !patientData.email) {
        throw createError({ statusCode: 400, message: 'Patient full_name and email are required' })
    }
    if (!isValidEmail(patientData.email)) {
        throw createError({ statusCode: 400, message: 'Invalid email address' })
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
    const parsedDate = new Date(appointment_date + 'T00:00:00')
    if (Number.isNaN(parsedDate.getTime())) {
        throw createError({ statusCode: 400, message: 'Invalid date' })
    }
    const dayOfWeek = parsedDate.getDay()
    const slotMin = toMinutes(appointment_time)

    // 1. Holiday check
    const { data: holiday } = await admin
        .from('public_booking_holidays')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('holiday_date', appointment_date)
        .maybeSingle()

    if (holiday) {
        throw createError({ statusCode: 400, message: 'Cannot book on a holiday' })
    }

    // 2. Opening hours for that day
    const { data: openingHour } = await admin
        .from('public_booking_opening_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle()

    if (!openingHour) {
        throw createError({ statusCode: 400, message: 'Booking is closed on this day' })
    }

    // 3. Doctor availability
    const { data: doctor, error: doctorError } = await admin
        .from('doctors')
        .select('id, department_id')
        .eq('id', doctor_id)
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .maybeSingle()

    if (doctorError) throw createError({ statusCode: 500, message: doctorError.message })
    if (!doctor) {
        throw createError({ statusCode: 404, message: 'Doctor not available for public booking' })
    }

    // 4. Doctor schedule for that day
    const { data: schedule } = await admin
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctor_id)
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .eq('public_booking_enabled', true)
        .maybeSingle()

    if (!schedule) {
        throw createError({ statusCode: 400, message: 'Doctor is not available on this day' })
    }

    // 5. Validate slot is on the 30-min grid and within the effective window
    const startMin = Math.max(
        toMinutes(openingHour.start_time),
        toMinutes(schedule.public_booking_start ?? schedule.start_time),
    )
    const endMin = Math.min(
        toMinutes(openingHour.end_time),
        toMinutes(schedule.public_booking_end ?? schedule.end_time),
    )

    const gridStartMin = Math.ceil(startMin / SLOT_MINUTES) * SLOT_MINUTES

    if (slotMin % SLOT_MINUTES !== 0) {
        throw createError({ statusCode: 400, message: `Time must be on a ${SLOT_MINUTES}-minute grid` })
    }
    if (slotMin < gridStartMin || slotMin + SLOT_MINUTES > endMin) {
        throw createError({ statusCode: 400, message: 'Selected time is outside the available booking window' })
    }

    // 6. Capacity check
    const maxPatients = schedule.max_patients ?? 20
    const { count: bookedCount } = await admin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctor_id)
        .eq('tenant_id', tenantId)
        .eq('appointment_date', appointment_date)
        .eq('appointment_time', appointment_time)
        .in('status', ['waiting', 'in_progress'])

    if ((bookedCount ?? 0) >= maxPatients) {
        throw createError({ statusCode: 400, message: 'This time slot is no longer available' })
    }

    // 7. Find or create patient
    const email = patientData.email.trim().toLowerCase()

    const { data: profilesByEmail } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .returns<{ id: string }[]>()

    const profileIds = (profilesByEmail ?? []).map((p) => p.id)

    let patientId: string | null = null
    if (profileIds.length) {
        const { data: matched } = await admin
            .from('patients')
            .select('id')
            .eq('tenant_id', tenantId)
            .in('profile_id', profileIds)
            .maybeSingle()
        if (matched) patientId = matched.id
    }

    if (!patientId) {
        const { data: matchedByEmail } = await admin
            .from('patients')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('email', email)
            .maybeSingle()
        if (matchedByEmail) patientId = matchedByEmail.id
    }

    if (!patientId) {
        const { data: newPatient, error: patientError } = await admin
            .from('patients')
            .insert({
                tenant_id: tenantId,
                full_name: patientData.full_name.trim(),
                email,
                phone: patientData.phone ?? null,
                date_of_birth: patientData.date_of_birth ?? null,
                gender: patientData.gender ?? null,
            })
            .select('id')
            .single()

        if (patientError) throw createError({ statusCode: 500, message: patientError.message })
        patientId = newPatient.id
    }

    // 8. Insert appointment (with tenant_id, unlike the old patient booking endpoint)
    const { data: appointment, error: appointmentError } = await admin
        .from('appointments')
        .insert({
            patient_id: patientId,
            doctor_id,
            department_id: doctor.department_id ?? null,
            appointment_date,
            appointment_time,
            type: 'appointment',
            status: 'waiting',
            chief_complaint: chief_complaint ?? null,
            tenant_id: tenantId,
        })
        .select()
        .single()

    if (appointmentError) throw createError({ statusCode: 500, message: appointmentError.message })

    // 9. Log activity
    await admin.rpc('log_activity', {
        p_actor_id: null,
        p_tenant_id: tenantId,
        p_action: 'create',
        p_module: 'appointments',
        p_entity_id: appointment.id,
        p_description: `Public booking created for ${patientData.full_name} (${email}) on ${appointment_date} ${appointment_time}`,
        p_metadata: { after: appointment },
    })

    // 10. Notify doctor + receptionists + admins
    const doctorRecipientIds = await getRecipientIdsByRoles(admin, ['doctor'], null)
    const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'], null)
    const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'], null)

    const notifications: {
        user_id: string
        type: string
        title: string
        body: string
        data: Record<string, any>
    }[] = []

    if (doctorRecipientIds.includes(doctor_id)) {
        notifications.push({
            user_id: doctor_id,
            type: 'appointment_new',
            title: 'New appointment assigned',
            body: `You have a new public booking on ${appointment_date} at ${appointment_time}.`,
            data: {
                entity_type: 'appointment',
                entity_id: appointment.id,
                patient_id: patientId,
                doctor_id,
                department_id: doctor.department_id ?? null,
                appointment_date,
                appointment_time,
                type: 'appointment',
                audience_role: 'doctor',
                redirect_to: '/doctor/appointments',
            },
        })
    }

    notifications.push(
        ...receptionistRecipientIds.map((user_id) => ({
            user_id,
            type: 'appointment_new',
            title: 'New appointment created',
            body: `New public booking from ${patientData.full_name} on ${appointment_date} at ${appointment_time}.`,
            data: {
                entity_type: 'appointment',
                entity_id: appointment.id,
                patient_id: patientId,
                doctor_id,
                department_id: doctor.department_id ?? null,
                appointment_date,
                appointment_time,
                type: 'appointment',
                audience_role: 'receptionist',
                redirect_to: '/receptionist/appointments',
            },
        })),
    )

    notifications.push(
        ...adminRecipientIds.map((user_id) => ({
            user_id,
            type: 'appointment_new',
            title: 'New appointment created',
            body: `New public booking from ${patientData.full_name} on ${appointment_date} at ${appointment_time}.`,
            data: {
                entity_type: 'appointment',
                entity_id: appointment.id,
                patient_id: patientId,
                doctor_id,
                department_id: doctor.department_id ?? null,
                appointment_date,
                appointment_time,
                type: 'appointment',
                audience_role: 'admin',
            },
        })),
    )

    await insertNotifications(admin, notifications)

    return {
        appointment: {
            id: appointment.id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            status: appointment.status,
        },
    }
})
