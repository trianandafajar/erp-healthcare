export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('permissions')
        .select('id, name, label, module, created_at')
        .order('module', { ascending: true })

    if (error) throw createError({ statusCode: 400, message: error.message })

    const grouped = data.reduce((acc: Record<string, any[]>, perm) => {
        const moduleKey = perm.module ?? 'unknown'
        const group = acc[moduleKey] ?? []
        group.push(perm)
        acc[moduleKey] = group
        return acc
    }, {})

    return { permissions: data, grouped }
})