export default defineEventHandler(async (event) => {
    const { price_id, tenant_id, success_url, cancel_url } = await readBody(event)

    if (!price_id || !tenant_id) {
        throw createError({ statusCode: 400, message: 'price_id and tenant_id are required' })
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: price_id, quantity: 1 }],
        client_reference_id: tenant_id,
        success_url: success_url || `${getRequestURL(event).origin}/login?checkout=success`,
        cancel_url: cancel_url || `${getRequestURL(event).origin}/register?canceled=true`,
    })

    return { url: session.url }
})
