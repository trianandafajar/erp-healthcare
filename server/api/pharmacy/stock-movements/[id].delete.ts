import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'pharmacy_module')
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Movement id is required',
        })
    }

    const admin = supabaseAdmin()

    const { data: movement, error: movementError } = await admin
        .from('medicine_stock_movements')
        .select('*')
        .eq('id', id)
        .single()

    if (movementError || !movement) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: movementError?.message ?? 'Movement not found',
        })
    }

    const { data: stock, error: stockError } = await admin
        .from('medicine_stocks')
        .select('*')
        .eq('id', movement.medicine_stock_id)
        .single()

    if (stockError || !stock) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: stockError?.message ?? 'Stock not found',
        })
    }

    const nextQuantity = movement.movement_type === 'Incoming'
        ? Math.max(0, Number(stock.quantity ?? 0) - Number(movement.quantity ?? 0))
        : Math.max(0, Number(stock.quantity ?? 0) + Number(movement.quantity ?? 0))

    const { error: stockUpdateError } = await admin
        .from('medicine_stocks')
        .update({ quantity: nextQuantity })
        .eq('id', stock.id)

    if (stockUpdateError) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: stockUpdateError.message,
        })
    }

    const { error: deleteError } = await admin
        .from('medicine_stock_movements')
        .delete()
        .eq('id', id)

    if (deleteError) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: deleteError.message,
        })
    }

    return { ok: true }
})
