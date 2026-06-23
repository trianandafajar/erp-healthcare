export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await admin
        .from('appointments')
        .update(body)
        .eq('id', id)
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'update',
        p_module: 'appointments',
        p_entity_id: data.id,
        p_description: `Updated appointment ${id}`,
        p_metadata: { after: data }
    })

    return { appointment: data }
})