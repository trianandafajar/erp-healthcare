import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'pharmacy_module')
    const id = getRouterParam(event, 'id')
    const body = await readBodyObject(event)
    const quantityDelta = toRequiredNumber(body?.quantityDelta ?? 0, 'quantityDelta')
    checkField(isInt(quantityDelta), 'Quantity delta must be an integer')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Stock id is required',
        })
    }

    checkFormat(isUUID(id), 'ID', 'UUID')

    const { data: { user } } = await serverSupabase(event).auth.getUser()
    const admin = supabaseAdmin()

    const { data: stock, error: stockError } = await admin
        .from('medicine_stocks')
        .select('*')
        .eq('id', id)
        .single()

    if (stockError || !stock) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: stockError?.message ?? 'Stock not found',
        })
    }

    const nextQuantity = Math.max(0, Number(stock.quantity ?? 0) + quantityDelta)

    const { error: updateError } = await admin
        .from('medicine_stocks')
        .update({ quantity: nextQuantity })
        .eq('id', id)

    if (updateError) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: updateError.message,
        })
    }

    await admin.from('medicine_stock_movements').insert({
        medicine_stock_id: id,
        movement_type: quantityDelta >= 0 ? 'Incoming' : 'Outgoing',
        medicine_name: stock.medicine_name,
        dosage: stock.dosage ?? '',
        quantity: Math.abs(quantityDelta),
        reason_or_supplier: 'Manual Adjustment',
        reference: `ADJ-${Date.now()}`,
        note: `Adjusted by ${quantityDelta >= 0 ? '+' : ''}${quantityDelta}`,
        batch_number: stock.batch_number,
        expired_date: stock.expired_date,
        created_by: user?.id ?? null,
    })

    return { ok: true }
})
