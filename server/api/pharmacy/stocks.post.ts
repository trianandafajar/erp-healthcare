import type { StockItem } from '~/types/pharmacy'

type StockPayload = Partial<StockItem> & {
    medicineName: string
    dosage: string
    supplier: string
    batchNumber: string
    expiredDate: string
    quantity: number
    minimumStock: number
    unit: string
}

type StockRow = {
    id: string
    medicine_name: string
    dosage: string
    supplier: string
    batch_number: string
    expired_date: string
    quantity: number
    minimum_stock: number
    unit: string
    created_at: string
    updated_at: string | null
}

function mapRow(row: StockRow): StockItem {
    return {
        id: row.id,
        medicineName: row.medicine_name,
        dosage: row.dosage || '',
        supplier: row.supplier,
        batchNumber: row.batch_number,
        expiredDate: row.expired_date,
        quantity: row.quantity,
        minimumStock: row.minimum_stock,
        unit: row.unit,
        updatedAt: row.updated_at ?? row.created_at,
    }
}

export default defineEventHandler(async (event) => {
    const payload = await readBody<StockPayload>(event)

    if (!payload?.medicineName?.trim() || !payload?.dosage?.trim() || !payload?.supplier?.trim() || !payload?.batchNumber?.trim()) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'medicineName, dosage, supplier, and batchNumber are required',
        })
    }

    const admin = supabaseAdmin()
    const expiredDate = new Date(payload.expiredDate).toISOString().slice(0, 10)

    const record = {
        medicine_name: payload.medicineName.trim(),
        dosage: payload.dosage.trim(),
        supplier: payload.supplier.trim(),
        batch_number: payload.batchNumber.trim(),
        expired_date: expiredDate,
        quantity: Number(payload.quantity ?? 0),
        minimum_stock: Number(payload.minimumStock ?? 20),
        unit: payload.unit?.trim() || 'tablet',
    }

    let result

    if (payload.id) {
        result = await admin
            .from('medicine_stocks')
            .update(record)
            .eq('id', payload.id)
            .select('*')
            .single()
    } else {
        result = await admin
            .from('medicine_stocks')
            .insert(record)
            .select('*')
            .single()
    }

    if (result.error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: result.error.message,
        })
    }

    return mapRow(result.data as StockRow)
})
