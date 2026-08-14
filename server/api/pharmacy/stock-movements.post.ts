type MovementPayload = {
    type: 'Incoming' | 'Outgoing'
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

import { requirePlanFeature } from "~~/server/utils/planGuard"

export default defineEventHandler(async (event) => {
    requirePlanFeature(event, 'pharmacy_module')
    const payload = await readBody<MovementPayload>(event)

    if (!payload?.type || !payload?.medicineName?.trim() || !payload?.dosage?.trim() || !payload?.quantity) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'type, medicineName, dosage, and quantity are required',
        })
    }

    checkField(isEnum(payload.type, ['Incoming', 'Outgoing']), 'type', 'enum (Incoming/Outgoing)')
    const quantity = toRequiredNumber(payload.quantity, 'quantity')
    checkField(isInt(quantity, { min: 1 }), 'Quantity must be a positive integer')
    if (payload.stockId) checkFormat(isUUID(payload.stockId), 'stockId', 'UUID')
    if (payload.expiredDate) checkFormat(isISO8601(payload.expiredDate), 'expiredDate', 'date')

    const { data: { user } } = await serverSupabase(event).auth.getUser()
    const admin = supabaseAdmin()
    const medicineName = payload.medicineName.trim()
    const dosage = payload.dosage.trim()
    const now = new Date().toISOString()
    const reference = `${payload.type === 'Incoming' ? 'IN' : 'OUT'}-${Date.now()}`

    const lookupQuery = payload.stockId
        ? admin.from('medicine_stocks').select('*').eq('id', payload.stockId).single()
        : admin.from('medicine_stocks').select('*').eq('medicine_name', medicineName).eq('dosage', dosage).eq('batch_number', payload.batchNumber?.trim() ?? '').single()

    const { data: stock, error: stockError } = await lookupQuery

    if (stockError && payload.type === 'Outgoing') {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
            message: stockError.message || 'Stock not found',
        })
    }

    let stockId = stock?.id ?? payload.stockId ?? null
    let batchNumber = payload.batchNumber?.trim() ?? stock?.batch_number ?? '-'
    let expiredDate = payload.expiredDate ? new Date(payload.expiredDate).toISOString().slice(0, 10) : stock?.expired_date ?? now.slice(0, 10)

    if (payload.type === 'Incoming') {
        if (stock) {
            const { error: updateError } = await admin
                .from('medicine_stocks')
                .update({
                    supplier: payload.supplier?.trim() || stock.supplier,
                    batch_number: batchNumber,
                    expired_date: expiredDate,
                    quantity: Number(stock.quantity ?? 0) + quantity,
                })
                .eq('id', stock.id)

            if (updateError) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Server Error',
                    message: updateError.message,
                })
            }
        } else {
            const { data: insertedStock, error: insertError } = await admin
                .from('medicine_stocks')
                .insert({
                    medicine_name: medicineName,
                    dosage,
                    supplier: payload.supplier?.trim() || '-',
                    batch_number: batchNumber,
                    expired_date: expiredDate,
                    quantity,
                    minimum_stock: 20,
                    unit: 'tablet',
                })
                .select('*')
                .single()

            if (insertError) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Server Error',
                    message: insertError.message,
                })
            }

            stockId = insertedStock.id
        }
    } else {
        if (!stock) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Not Found',
                message: 'Stock not found',
            })
        }

        const nextQuantity = Math.max(0, Number(stock.quantity ?? 0) - quantity)

        const { error: updateError } = await admin
            .from('medicine_stocks')
            .update({ quantity: nextQuantity })
            .eq('id', stock.id)

        if (updateError) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Server Error',
                message: updateError.message,
            })
        }
    }

    const { data: movement, error: movementError } = await admin
        .from('medicine_stock_movements')
        .insert({
            medicine_stock_id: stockId,
            movement_type: payload.type,
            medicine_name: medicineName,
            dosage,
            quantity,
            reason_or_supplier: payload.type === 'Incoming' ? (payload.supplier?.trim() || stock?.supplier || '-') : (payload.reason?.trim() || 'Manual Adjustment'),
            reference,
            note: payload.note?.trim() || '',
            batch_number: batchNumber,
            expired_date: expiredDate,
            created_by: user?.id ?? null,
        })
        .select('*')
        .single()

    if (movementError) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: movementError.message,
        })
    }

    return movement
})
