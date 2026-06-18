export default defineEventHandler(async (event) => {
    const { id, name, label, module, category } = await readBody(event)

    if (!id) throw createError({ statusCode: 400, message: 'Permission ID is required' })

    const validCategories = ['admin', 'doctor', 'nurse', 'patient', 'pharmacy', 'receptionist']
    if (category && !validCategories.includes(category)) {
        throw createError({ statusCode: 400, message: `Category must be one of: ${validCategories.join(', ')}` })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: before } = await admin
        .from('permissions')
        .select('*')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('permissions')
        .update({ name, label, module, category: category ?? null })
        .eq('id', id)

    if (error) throw createError({ statusCode: 400, message: error.message })

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'update',
        p_module: 'permissions',
        p_entity_id: id,
        p_description: `Updated permission '${name ?? before?.name}'`,
        p_metadata: {
            before: before ?? null,
            after: { name, label, module }
        }
    })

    return { message: 'Permission updated successfully' }
})