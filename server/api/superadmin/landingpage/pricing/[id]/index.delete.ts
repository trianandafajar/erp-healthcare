export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    const admin = supabaseAdmin()

    const { data: existing } = await admin
        .from('pricing_plans')
        .select('stripe_product_id, title')
        .eq('id', id)
        .single()

    if (!existing) throw createError({ statusCode: 404, message: 'Plan not found' })

    if (existing.stripe_product_id) {
        await stripe.products.update(existing.stripe_product_id, { active: false })
    }

    // Delete associated plan_features
    const planKey = existing.title.toLowerCase().replace(/\s+/g, '_')
    await admin.from('plan_features').delete().eq('plan', planKey)

    const { error } = await admin
        .from('pricing_plans')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
})
