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

    const { data: tenants, error } = await admin
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 500, message: error.message })

    const tenantIds = tenants.map((t) => t.id)

    const ownerIds = [...new Set(tenants.map((t) => t.owner_id).filter(Boolean))]

    let profilesMap: Record<string, any> = {}
    if (ownerIds.length > 0) {
        const { data: profiles, error: profileError } = await admin
            .from('profiles')
            .select('id, email, full_name')
            .in('id', ownerIds)

        if (profileError) throw createError({ statusCode: 500, message: profileError.message })

        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    }

    let userCountMap: Record<string, number> = {}
    if (tenantIds.length > 0) {
        const { data: allProfiles, error: countError } = await admin
            .from('profiles')
            .select('tenant_id')
            .in('tenant_id', tenantIds)

        if (countError) throw createError({ statusCode: 500, message: countError.message })

        userCountMap = allProfiles.reduce((acc: Record<string, number>, p) => {
            if (p.tenant_id) {
                acc[p.tenant_id] = (acc[p.tenant_id] ?? 0) + 1
            }
            return acc
        }, {})
    }

    const tenantsWithDetails = tenants.map((t) => ({
        ...t,
        owner: t.owner_id ? profilesMap[t.owner_id] ?? null : null,
        total_users: userCountMap[t.id] ?? 0,
    }))

    return tenantsWithDetails
})