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

    return {
        message: 'Doctor schedule removed successfully',
    }
})