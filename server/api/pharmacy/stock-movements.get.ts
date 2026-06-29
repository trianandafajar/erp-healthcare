import type { StockMovementItem } from '~/types/pharmacy'

type MovementRow = {
    id: string
    medicine_stock_id: string | null
    movement_type: 'Incoming' | 'Outgoing'
    medicine_name: string
    dosage: string
    quantity: number
    reason_or_supplier: string
    reference: string
    note: string | null
    batch_number: string | null
    expired_date: string | null
    created_at: string
    created_by: string | null
}

export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const { data, error } = await admin
        .from('medicine_stock_movements')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Server Error',
            message: error.message,
        })
    }

    const rows = (data ?? []) as unknown as MovementRow[]

    const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[]

    let profileMap: Record<string, string> = {}

    if (userIds.length > 0) {
        const { data: profiles } = await admin
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

        for (const p of profiles ?? []) {
            profileMap[p.id] = p.full_name ?? 'Unknown'
        }
    }

    return rows.map((row) => {
        return {
            id: row.id,
            type: row.movement_type,
            medicineStockId: row.medicine_stock_id,
            medicineName: row.medicine_name,
            dosage: row.dosage || '',
            quantity: row.quantity,
            reasonOrSupplier: row.reason_or_supplier,
            reference: row.reference,
            note: row.note ?? '',
            createdAt: row.created_at,
            batchNumber: row.batch_number ?? '-',
            expiredDate: row.expired_date ?? row.created_at,
            performedBy: row.created_by ? (profileMap[row.created_by] ?? 'Unknown') : null,
        } satisfies StockMovementItem
    })
})
