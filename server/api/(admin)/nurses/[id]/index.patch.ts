export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const nurseId = getRouterParam(event, 'id')

    if (!nurseId) throw createError({ statusCode: 400, message: 'Nurse ID is required' })

    const body = await readBody(event)

    const allowed = ['phone', 'department_id', 'experience_years', 'is_available']
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await admin
        .from('nurses')
        .update(updates)
        .eq('id', nurseId)
        .select(`
            id, phone, experience_years, is_available, updated_at,
            profiles ( full_name, email, avatar_url, status ),
            departments:department_id ( id, name, code )
        `)
        .single()
        .returns<any>()

    if (error) throw createError({ statusCode: 400, message: error.message })
    if (!data) throw createError({ statusCode: 404, message: 'Nurse not found' })

    if (body.full_name !== undefined) {
        await admin
            .from('profiles')
            .update({ full_name: body.full_name, updated_at: new Date().toISOString() })
            .eq('id', nurseId)
    }

    return { data }
})