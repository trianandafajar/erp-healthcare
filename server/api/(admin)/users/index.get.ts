export default defineEventHandler(async (event) => {
    const adminSupabase = supabaseAdmin()
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select(`
        id,
        full_name,
        email,
        status,
        created_at,
        updated_at,
        user_roles (
            roles (
                name,
                label
            )
        )
    `)
        .neq('id', user?.id)
        .returns<any[]>()

    if (error) {
        throw createError({ statusCode: 404, message: error.message })
    }

    // flatten role
    const result = profiles.map(p => ({
        ...p,
        role: p.user_roles?.[0]?.roles?.name ?? null,
        role_label: p.user_roles?.[0]?.roles?.label ?? null,
        user_roles: undefined
    }))

    return { profiles: result }
})