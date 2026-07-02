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
        .returns<{ tenant_id: string }>()

    if (profileError || !profile) {
        throw createError({ statusCode: 404, message: 'Profile not found' })
    }

    return {
        admin,
        user,
        tenantId: profile.tenant_id,
    }
}