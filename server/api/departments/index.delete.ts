export default defineEventHandler(async (event) => {
    const { id } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Department ID is required' })

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: usedByDoctor } = await admin
        .from('doctors')
        .select('id')
        .eq('department_id', id)
        .limit(1)

    if (usedByDoctor?.length) {
        throw createError({ statusCode: 400, message: 'Cannot delete department that has doctors' })
    }

    const { data: before } = await admin
        .from('departments')
        .select('*')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('departments')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'delete',
        p_module: 'departments',
        p_entity_id: id,
        p_description: `Deleted department '${before?.name ?? '-'}'`,
        p_metadata: { before: before ?? null }
    })

    return { message: 'Department deleted successfully' }
})