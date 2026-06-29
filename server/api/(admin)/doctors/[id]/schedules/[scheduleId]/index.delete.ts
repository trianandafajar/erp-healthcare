import { getRecipientIdsByRoles, insertNotifications } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
    const doctorId = getRouterParam(event, 'id')
    const scheduleId = getRouterParam(event, 'scheduleId')

    if (!doctorId || !scheduleId) {
        throw createError({
            statusCode: 400,
            message: 'Doctor ID and Schedule ID are required',
        })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: before } = await admin
        .from('doctor_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('doctor_id', doctorId)
        .single()

    const { error } = await admin
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('doctor_id', doctorId)

    if (error) {
        throw createError({
            statusCode: 400,
            message: error.message,
        })
    }

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'delete',
        p_module: 'doctor_schedule',
        p_entity_id: scheduleId,
        p_description: `Removed doctor schedule`,
        p_metadata: {
            doctor_id: doctorId,
            before: before ?? null,
        },
    })

    const receptionistRecipientIds = await getRecipientIdsByRoles(admin, ['receptionist'])
    const adminRecipientIds = await getRecipientIdsByRoles(admin, ['admin'])

    await insertNotifications(
        admin,
        [
            {
                user_id: doctorId,
                type: 'schedule_deleted',
                title: 'Schedule removed',
                body: 'A schedule on your practice calendar has been removed.',
                data: {
                    entity_type: 'doctor_schedule',
                    entity_id: scheduleId,
                    doctor_id: doctorId,
                    level: 'critical',
                    audience_role: 'doctor',
                    redirect_to: '/doctor/schedule',
                },
            },
            ...receptionistRecipientIds.map((user_id) => ({
                user_id,
                type: 'schedule_deleted',
                title: 'Doctor schedule removed',
                body: 'A doctor schedule has been removed from the roster.',
                data: {
                    entity_type: 'doctor_schedule',
                    entity_id: scheduleId,
                    doctor_id: doctorId,
                    level: 'critical',
                    audience_role: 'receptionist',
                    redirect_to: '/receptionist/doctor-schedules',
                },
            })),
            ...adminRecipientIds.map((user_id) => ({
                user_id,
                type: 'schedule_deleted',
                title: 'Doctor schedule removed',
                body: 'A doctor schedule has been removed from the roster.',
                data: {
                    entity_type: 'doctor_schedule',
                    entity_id: scheduleId,
                    doctor_id: doctorId,
                    level: 'critical',
                    audience_role: 'admin',
                },
            })),
        ],
    )

    return {
        message: 'Doctor schedule removed successfully',
    }
})
