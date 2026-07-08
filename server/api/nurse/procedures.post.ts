import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'nurse_module')
    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()
    const body = await readBody(event)

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const { data: roleData, error: roleError } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    if (roleError) {
        throw createError({ statusCode: 400, message: roleError.message })
    }

    const role = (roleData as any)?.[0]?.roles?.name

    if (role !== 'nurse') {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const { data, error } = await admin
        .from('nurse_procedures')
        .insert({
            patient_id: body.patient_id,
            procedure_name: body.procedure_name,
            scheduled_at: body.scheduled_at,
            ended_at: body.ended_at ?? null,
            priority: body.priority ?? 'Medium',
            status: body.status ?? 'Planned',
            notes: body.notes ?? null,
            recorded_by: user.id,
        })
        .select(`
            id,
            patient_id,
            procedure_name,
            scheduled_at,
            ended_at,
            priority,
            status,
            notes,
            recorded_by,
            created_at,
            updated_at,
            patients (
                full_name,
                medical_record_number
            ),
            profiles (
                full_name
            )
        `)
        .single()

    if (error) {
        throw createError({ statusCode: 400, message: error.message })
    }

    return { procedure: data }
})
