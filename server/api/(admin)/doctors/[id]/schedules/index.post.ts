import { getTenantContext } from '~~/server/utils/getTenantContext'
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    checkFormat(isUUID(doctorId), 'ID', 'UUID')

    const body = await readBodyObject(event)
    const { day_of_week, start_time, end_time, max_patients } = body

    if (day_of_week === undefined || !start_time || !end_time) {
        throw createError({
            statusCode: 400,
            message: 'day_of_week, start_time, and end_time are required',
        })
    }

    checkField(isInt(day_of_week, { min: 0, max: 6 }), 'Day of week must be an integer between 0 and 6')
    checkField(isNonEmptyString(start_time), 'Start time is invalid')
    checkField(isNonEmptyString(end_time), 'End time is invalid')

    let maxPatients: number | null = null
    if (max_patients !== undefined && max_patients !== null && max_patients !== '') {
        maxPatients = toRequiredNumber(max_patients, 'max_patients')
        checkField(isInt(maxPatients, { min: 1 }), 'Max patients must be a positive integer')
    }

    const { data, error } = await admin
        .from('doctor_schedules')
        .insert({
            doctor_id: doctorId,
            day_of_week,
            start_time,
            end_time,
            max_patients: maxPatients,
            is_active: true,
            tenant_id: tenantId,
        })
        .select()
        .single()
        .returns<any>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'])
    const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'])

    await insertNotifications(
        admin,
        [
            {
                user_id: doctorId,
                type: 'schedule_created',
                title: 'New schedule assigned',
                body: `A new schedule has been added for your practice time.`,
                data: {
                    entity_type: 'doctor_schedule',
                    entity_id: data.id,
                    doctor_id: doctorId,
                    day_of_week: data.day_of_week,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    level: 'info',
                    audience_role: 'doctor',
                    redirect_to: '/doctor/schedule',
                },
            },
            ...receptionistRecipientIds.map((user_id) => ({
                user_id,
                type: 'schedule_created',
                title: 'Doctor schedule added',
                body: `A doctor schedule for day ${data.day_of_week} is now available.`,
                data: {
                    entity_type: 'doctor_schedule',
                    entity_id: data.id,
                    doctor_id: doctorId,
                    day_of_week: data.day_of_week,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    level: 'info',
                    audience_role: 'receptionist',
                    redirect_to: '/receptionist/doctor-schedules',
                },
            })),
            ...adminRecipientIds.map((user_id) => ({
                user_id,
                type: 'schedule_created',
                title: 'Doctor schedule added',
                body: `A doctor schedule for day ${data.day_of_week} is now available.`,
                data: {
                    entity_type: 'doctor_schedule',
                    entity_id: data.id,
                    doctor_id: doctorId,
                    day_of_week: data.day_of_week,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    level: 'info',
                    audience_role: 'admin',
                },
            })),
        ],
    )

    return { data }
})
