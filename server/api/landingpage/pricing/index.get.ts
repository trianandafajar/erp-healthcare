export default defineEventHandler(async () => {
    const { data, error } = await supabaseEphemeral()
        .from('pricing_plans')
        .select('id, title, subtitle, price, yearly_price, currency, features, button_label, button_link, is_recommended, badge_text, sort_order, stripe_price_id, stripe_price_id_yearly')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { plans: data ?? [] }
})
