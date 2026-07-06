export default defineEventHandler(async (event) => {
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const tenantId = getRouterParam(event, 'id')
    if (!tenantId) throw createError({ statusCode: 400, message: 'Tenant ID is required' })

    const body = await readBody(event)
    const { subscription_status, subscription_plan, name, slug, brand_color } = body

    const validStatuses = ['active', 'suspended', 'trial', 'inactive']
    if (subscription_status && !validStatuses.includes(subscription_status)) {
        throw createError({ statusCode: 400, message: `Status must be one of: ${validStatuses.join(', ')}` })
    }

    const admin = supabaseAdmin()

    // Build update payload from only provided fields
    const updatePayload: Record<string, any> = {}
    if (subscription_status !== undefined) updatePayload.subscription_status = subscription_status
    if (subscription_plan !== undefined) updatePayload.subscription_plan = subscription_plan
    if (name !== undefined) updatePayload.name = name
    if (slug !== undefined) updatePayload.slug = slug
    if (brand_color !== undefined) {
        if (!/^#[0-9a-fA-F]{6}$/.test(brand_color)) {
            throw createError({ statusCode: 400, message: 'Invalid color format. Use hex (e.g. #176D37)' })
        }
        updatePayload.brand_color = brand_color
    }

    if (Object.keys(updatePayload).length === 0) {
        throw createError({ statusCode: 400, message: 'No fields to update' })
    }

    const { error } = await admin
        .from('tenants')
        .update(updatePayload)
        .eq('id', tenantId)

    if (error) throw createError({ statusCode: 400, message: error.message })

    return { message: 'Tenant updated successfully' }
})