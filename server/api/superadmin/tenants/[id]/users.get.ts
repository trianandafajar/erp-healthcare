export default defineEventHandler(async (event) => {
    const admin = supabaseAdmin()
    const tenantId = getRouterParam(event, 'id')

    const { data, error } = await admin
        .from('profiles')
        .select(`
            id, full_name, email, status, created_at, avatar_url,
            user_roles ( roles ( name, label ) )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const users = data.map((u: any) => ({
        id: u.id,
        full_name: u.full_name ?? '-',
        email: u.email ?? '-',
        status: u.status,
        created_at: u.created_at,
        avatar_url: u.avatar_url,
        role: u.user_roles?.[0]?.roles?.name ?? null,
        role_label: u.user_roles?.[0]?.roles?.label ?? '-',
    }))

    return { users }
})