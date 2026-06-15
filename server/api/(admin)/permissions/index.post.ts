export default defineEventHandler(async (event) => {
    const { name, label, module } = await readBody(event)

    if (!name || !label || !module) {
        throw createError({ statusCode: 400, message: 'Name, label, and module are required' })
    }

    const nameRegex = /^[a-z]+\.[a-z]+$/
    if (!nameRegex.test(name)) {
        throw createError({
            statusCode: 400,
            message: 'Permission name must be in format: module.action (e.g. user.view)'
        })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await admin
        .from('permissions')
        .insert({ name, label, module })
        .select()
        .single()

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'permissions',
        p_entity_id: data.id,
        p_description: `Created permission '${data.name}'`,
        p_metadata: { after: data }
    })

    return { permission: data }
})