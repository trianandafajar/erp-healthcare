export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('permissions')
        .select('id, name, label, module, category, created_at')
        .order('module', { ascending: true })

    if (error) throw createError({ statusCode: 400, message: error.message })

    const grouped = data.reduce((acc: Record<string, any[]>, perm) => {
        const mod = perm.module ?? 'uncategorized'
        if (!acc[mod]) acc[mod] = []
        acc[mod].push(perm)
        return acc
    }, {})

    const groupedByCategory = data.reduce((acc: Record<string, any[]>, perm) => {
        const cat = perm.category ?? 'uncategorized'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(perm)
        return acc
    }, {})

    return { permissions: data, grouped, groupedByCategory }
}) 