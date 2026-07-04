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

    const admin = supabaseAdmin()

    const { data: profiles, error } = await admin
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            status,
            created_at,
            updated_at,
            tenant_id,
            user_roles (
                roles (
                    name,
                    label
                )
            )
        `)
        .neq('id', user.id)
        .returns<any[]>()

    if (error) throw createError({ statusCode: 404, message: error.message })

    const tenantIds = [...new Set(profiles.map(p => p.tenant_id).filter(Boolean))]
    let tenantMap: Record<string, { name: string; slug: string }> = {}
    if (tenantIds.length > 0) {
        const { data: tenants } = await admin
            .from('tenants')
            .select('id, name, slug')
            .in('id', tenantIds)
        if (tenants) {
            tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]))
        }
    }

    const result = profiles.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        tenant_id: p.tenant_id,
        tenant_name: p.tenant_id ? tenantMap[p.tenant_id]?.name ?? null : null,
        tenant_slug: p.tenant_id ? tenantMap[p.tenant_id]?.slug ?? null : null,
        role: p.user_roles?.[0]?.roles?.name ?? null,
        role_label: p.user_roles?.[0]?.roles?.label ?? null,
    }))

    return { profiles: result }
})
