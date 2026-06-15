export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('roles')
        .select(`
            id,
            name,
            label,
            created_at,
            role_permissions (
                permissions (
                    id,
                    name,
                    label,
                    module
                )
            ),
            user_roles (
                user_id
            )
        `)
        .order('created_at', { ascending: true })
        .returns<any[]>()

    if (error) throw createError({ statusCode: 400, message: error.message })

    const result = data.map(r => ({
        id: r.id,
        name: r.name,
        label: r.label,
        created_at: r.created_at,
        permissions: r.role_permissions.map((rp: any) => rp.permissions),
        user_count: r.user_roles.length
    }))

    return { roles: result }
})