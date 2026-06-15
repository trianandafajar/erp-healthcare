export default defineEventHandler(async (event) => {
    const { id, name, code, description } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Department ID is required' })

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: before } = await admin
        .from('departments')
        .select('*')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('departments')
        .update({ name, code, description })
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'update',
        p_module: 'departments',
        p_entity_id: id,
        p_description: `Updated department '${name ?? before?.name}'`,
        p_metadata: {
            before: before ?? null,
            after: { name, code, description }
        }
    })

    return { message: 'Department updated successfully' }
})