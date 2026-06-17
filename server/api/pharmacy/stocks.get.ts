import type { StockItem } from '~/types/pharmacy'

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

export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('medicine_stocks')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: error.message,
        })
    }

    return (data ?? []).map((item) => {
        const row = item as unknown as StockRow

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
        } satisfies StockItem
    })
})
