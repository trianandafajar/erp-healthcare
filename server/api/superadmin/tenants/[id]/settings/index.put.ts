export default withSuperadmin(async (event) => {
    const tenantId = getRouterParam(event, 'id')
    if (!tenantId) throw createError({ statusCode: 400, message: 'Tenant ID is required' })

    const body = await readBody(event)
    const { display_name, logo_url } = body

    if (display_name === undefined && logo_url === undefined) {
        throw createError({ statusCode: 400, message: 'No fields to update. Provide display_name and/or logo_url.' })
    }

    const admin = supabaseAdmin()

    // Check if settings row already exists
    const { data: existing } = await admin
        .from('tenant_settings')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle()

    const payload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (display_name !== undefined) payload.display_name = display_name
    if (logo_url !== undefined) payload.logo_url = logo_url

    if (existing) {
        const { data, error } = await admin
            .from('tenant_settings')
            .update(payload)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (error) throw createError({ statusCode: 500, message: error.message })
        return data
    } else {
        const { data, error } = await admin
            .from('tenant_settings')
            .insert({ tenant_id: tenantId, ...payload })
            .select()
            .single()

        if (error) throw createError({ statusCode: 500, message: error.message })
        return data
    }
})
