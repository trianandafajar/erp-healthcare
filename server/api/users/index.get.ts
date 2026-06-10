export default defineEventHandler(async (event) => {
    const adminSupabase = supabaseAdmin()
    const supabase = serverSupabase(event)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at, updated_at')
        .neq('id', user?.id)

    if (error) {
        throw createError({ statusCode: 404, message: error.message })
    }

    return { profiles }
})