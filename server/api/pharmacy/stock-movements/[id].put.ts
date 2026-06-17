type MovementPayload = {
    stockId?: string | null
    medicineName: string
    dosage: string
    supplier?: string
    batchNumber?: string
    expiredDate?: string
    quantity: number
    note?: string
    reason?: string
}

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const payload = await readBody<MovementPayload>(event)

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Movement id is required',
        })
    }

    if (!payload?.medicineName?.trim() || !payload?.dosage?.trim() || !payload?.quantity) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'medicineName, dosage and quantity are required',
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
        .eq('id', payload.stockId ?? movement.medicine_stock_id)
        .single()

    if (stockError || !stock) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: stockError?.message ?? 'Stock not found',
        })
    }

    if (movement.movement_type === 'Incoming') {
        const delta = Number(payload.quantity) - Number(movement.quantity ?? 0)
        const nextQuantity = Math.max(0, Number(stock.quantity ?? 0) + delta)

        const { error: stockUpdateError } = await admin
            .from('medicine_stocks')
            .update({
                medicine_name: payload.medicineName.trim(),
                dosage: payload.dosage.trim(),
                supplier: payload.supplier?.trim() || stock.supplier,
                batch_number: payload.batchNumber?.trim() || stock.batch_number,
                expired_date: payload.expiredDate ? new Date(payload.expiredDate).toISOString().slice(0, 10) : stock.expired_date,
                quantity: nextQuantity,
            })
            .eq('id', stock.id)

        if (stockUpdateError) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Server Error',
                message: stockUpdateError.message,
            })
        }
    } else {
        const delta = Number(movement.quantity ?? 0) - Number(payload.quantity)
        const nextQuantity = Math.max(0, Number(stock.quantity ?? 0) + delta)

        const { error: stockUpdateError } = await admin
            .from('medicine_stocks')
            .update({
                medicine_name: payload.medicineName.trim(),
                dosage: payload.dosage.trim(),
                quantity: nextQuantity,
            })
            .eq('id', stock.id)

        if (stockUpdateError) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Server Error',
                message: stockUpdateError.message,
            })
        }
    }

    const { data: updatedMovement, error: updateError } = await admin
        .from('medicine_stock_movements')
        .update({
            medicine_stock_id: stock.id,
            medicine_name: payload.medicineName.trim(),
            dosage: payload.dosage.trim(),
            quantity: Number(payload.quantity),
            reason_or_supplier: movement.movement_type === 'Incoming'
                ? (payload.supplier?.trim() || stock.supplier)
                : (payload.reason?.trim() || movement.reason_or_supplier),
            batch_number: payload.batchNumber?.trim() || stock.batch_number,
            expired_date: payload.expiredDate ? new Date(payload.expiredDate).toISOString().slice(0, 10) : stock.expired_date,
            note: payload.note?.trim() || '',
        })
        .eq('id', id)
        .select('*')
        .single()

    if (updateError) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: updateError.message,
        })
    }

    return updatedMovement
})
