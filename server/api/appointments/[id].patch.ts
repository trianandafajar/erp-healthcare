import { getTenantContext } from "~~/server/utils/getTenantContext"

const APPOINTMENT_STATUS = ['waiting', 'in_progress', 'done', 'cancelled'] as const
const APPOINTMENT_TYPE = ['appointment', 'walkin', 'referral'] as const
const APPOINTMENT_FIELDS = [
    'appointment_date',
    'appointment_time',
    'type',
    'status',
    'chief_complaint',
    'notes',
    'department_id',
] as const

export default defineEventHandler(async (event: any) => {
    const id = getRouterParam(event, 'id')
    const body = await readBodyObject(event)

    if (!id) throw createError({ statusCode: 400, message: 'ID is required' })
    checkFormat(isUUID(id), 'ID', 'UUID')

    const updates = pick(body, APPOINTMENT_FIELDS)

    if (updates.status !== undefined) checkFormat(isEnum(updates.status, APPOINTMENT_STATUS), 'status', 'enum')
    if (updates.type !== undefined) checkFormat(isEnum(updates.type, APPOINTMENT_TYPE), 'type', 'enum')
    if (updates.department_id !== undefined) checkFormat(isUUID(updates.department_id), 'department_id', 'UUID')
    if (updates.appointment_date !== undefined) checkFormat(isDateYMD(updates.appointment_date), 'appointment_date', 'date')
    if (updates.appointment_time !== undefined) checkFormat(isNonEmptyString(updates.appointment_time), 'appointment_time', 'time')
    if (updates.chief_complaint !== undefined) checkField(isShortText(updates.chief_complaint, 1000), 'Chief complaint is too long')
    if (updates.notes !== undefined) checkField(isShortText(updates.notes, 5000), 'Notes are too long')

    if (Object.keys(updates).length === 0) {
        throw createError({ statusCode: 400, message: 'No valid fields to update' })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data, error } = await admin
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'appointments',
        p_entity_id: data.id,
        p_description: `Updated appointment ${id}`,
        p_metadata: { after: data }
    })

    return { appointment: data }
})