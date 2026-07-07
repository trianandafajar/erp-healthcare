export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    const { data: existing } = await supabaseAdmin()
        .from('pricing_plans')
        .select('stripe_product_id')
        .eq('id', id)
        .single()

    if (!existing) throw createError({ statusCode: 404, message: 'Plan not found' })

    if (existing.stripe_product_id) {
        await stripe.products.update(existing.stripe_product_id, { active: false })
    }

    const { error } = await supabaseAdmin()
        .from('pricing_plans')
        .delete()
        .eq('id', id)

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
})
