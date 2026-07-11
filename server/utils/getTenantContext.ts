export async function getTenantContext(event: typeof H3Event) {
    const supabase = serverSupabase(event)
    const admin = supabaseAdmin()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
        .returns<{ tenant_id: string | null }>()

    if (profileError || !profile) {
        throw createError({ statusCode: 404, message: 'Profile not found' })
    }

    if (profile.tenant_id) {
        return { admin, user, tenantId: profile.tenant_id }
    }

    const { data: userRoles } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .returns<any[]>()

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) {
        throw createError({ statusCode: 403, message: 'User has no tenant' })
    }

    const previewSlug = getCookie(event, 'preview_tenant_slug')
    if (!previewSlug) {
        throw createError({ statusCode: 403, message: 'User has no tenant' })
    }

    const { data: previewTenant } = await admin
        .from('tenants')
        .select('id')
        .eq('slug', previewSlug)
        .single()
        .returns<{ id: string }>()

    if (!previewTenant) {
        throw createError({ statusCode: 404, message: 'Preview tenant not found' })
    }

    return { admin, user, tenantId: previewTenant.id }
}