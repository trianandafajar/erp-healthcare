import { getTenantContext } from '~~/server/utils/getTenantContext'
import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const doctorId = getRouterParam(event, 'id')

    if (!doctorId) {
        throw createError({ statusCode: 400, message: 'Doctor ID is required' })
    }

    const body = await readBody(event)
    const { day_of_week, start_time, end_time, max_patients } = body

    if (day_of_week === undefined || !start_time || !end_time) {
        throw createError({
            statusCode: 400,
            message: 'day_of_week, start_time, and end_time are required',
        })
    }

    const { data, error } = await admin
        .from('doctor_schedules')
        .insert({
            doctor_id: doctorId,
            day_of_week,
            start_time,
            end_time,
            max_patients: max_patients ?? null,
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
