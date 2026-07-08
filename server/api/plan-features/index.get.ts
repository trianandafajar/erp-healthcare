export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const plan = (query.plan as string) ?? null

    const supabase = supabaseEphemeral()

    let db = supabase
        .from('plan_features')
        .select('*')
        .order('sort_order', { ascending: true })

    if (plan) {
        db = db.eq('plan', plan)
    }

    const { data, error } = await db

    if (error) throw createError({ statusCode: 500, message: error.message })

    const grouped: Record<string, any[]> = {}
    for (const row of data ?? []) {
        if (!grouped[row.plan]) grouped[row.plan] = []
        grouped[row.plan].push(row)
    }

    return { features: data, grouped }
})
