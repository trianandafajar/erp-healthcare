export default defineEventHandler(async (event) => {
    const { name, code, description } = await readBody(event)

    if (!name) throw createError({ statusCode: 400, message: 'Name is required' })

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await admin
        .from('departments')
        .insert({ name, code, description })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'departments',
        p_entity_id: data.id,
        p_description: `Created department '${data.name}'`,
        p_metadata: { after: data }
    })

    return { department: data }
})