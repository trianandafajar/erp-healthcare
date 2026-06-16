import { computed } from 'vue'
import {
    createInitialMovements,
    createInitialPrescriptions,
    createInitialStocks,
    type PrescriptionItem,
    type PrescriptionStatus,
    type StockReason,
    type StockItem,
    type StockMovementItem,
} from '~/data/pharmacy'

const usePharmacyWorkspace = () => {
    const prescriptions = useState<PrescriptionItem[]>('pharmacy-prescriptions', createInitialPrescriptions)
    const stocks = useState<StockItem[]>('pharmacy-stocks', createInitialStocks)
    const movements = useState<StockMovementItem[]>('pharmacy-movements', createInitialMovements)

    const summary = computed(() => ({
        incomingCount: prescriptions.value.filter((item) => item.status === 'Pending').length,
        verifiedCount: prescriptions.value.filter((item) => item.status === 'Verified').length,
        dispensedCount: prescriptions.value.filter((item) => item.status === 'Dispensed').length,
        lowStockCount: stocks.value.filter((item) => item.stock <= item.minimumStock).length,
        incomingMovementCount: movements.value.filter((item) => item.type === 'Incoming').length,
        outgoingMovementCount: movements.value.filter((item) => item.type === 'Outgoing').length,
    }))

    const lowStockItems = computed(() => stocks.value.filter((item) => item.stock <= item.minimumStock))
    const recentPrescriptions = computed(() => prescriptions.value.slice(0, 4))
    const recentMovements = computed(() => movements.value.slice(0, 5))

    const updatePrescriptionStatus = (id: string, status: PrescriptionStatus, pharmacistNote?: string) => {
        const now = new Date().toISOString()
        prescriptions.value = prescriptions.value.map((item) => {
            if (item.id !== id) return item

            const patch: Partial<PrescriptionItem> = {
                status,
                pharmacistNote: pharmacistNote ?? item.pharmacistNote ?? null,
            }

            if (status === 'Verified') patch.verifiedAt = now
            if (status === 'Dispensed') patch.dispensedAt = now
            if (status === 'Rejected') patch.rejectionNote = pharmacistNote ?? item.rejectionNote ?? 'Returned to doctor'

            return { ...item, ...patch }
        })
    }

    const addPrescriptionNote = (id: string, pharmacistNote: string) => {
        prescriptions.value = prescriptions.value.map((item) => (
            item.id === id
                ? { ...item, pharmacistNote }
                : item
        ))
    }

    const upsertStockMedicine = (payload: Partial<StockItem> & { medicineName: string; supplier: string; batchNumber: string; expiredDate: string; quantity: number; minimumStock: number; unit: string }) => {
        const existingIndex = stocks.value.findIndex((item) => item.id === payload.id)
        const now = new Date().toISOString()

        const record: StockItem = {
            id: payload.id ?? `stk-${Date.now()}`,
            medicineName: payload.medicineName,
            supplier: payload.supplier,
            batchNumber: payload.batchNumber,
            expiredDate: payload.expiredDate,
            quantity: payload.quantity,
            minimumStock: payload.minimumStock,
            unit: payload.unit,
            updatedAt: now,
        }

        if (existingIndex === -1) {
            stocks.value = [record, ...stocks.value]
            return record
        }

        stocks.value = stocks.value.map((item) => (item.id === record.id ? record : item))
        return record
    }

    const adjustStock = (id: string, quantityDelta: number) => {
        const now = new Date().toISOString()
        stocks.value = stocks.value.map((item) => {
            if (item.id !== id) return item
            return {
                ...item,
                quantity: Math.max(0, item.quantity + quantityDelta),
                updatedAt: now,
            }
        })
    }

    const addIncomingStock = (payload: {
        medicineName: string
        supplier: string
        batchNumber: string
        expiredDate: string
        quantity: number
        note: string
    }) => {
        const existing = stocks.value.find((item) => item.medicineName === payload.medicineName && item.batchNumber === payload.batchNumber)
        const now = new Date().toISOString()

        if (existing) {
            stocks.value = stocks.value.map((item) => (
                item.id === existing.id
                    ? { ...item, supplier: payload.supplier, expiredDate: payload.expiredDate, quantity: item.quantity + payload.quantity, updatedAt: now }
                    : item
            ))
        } else {
            stocks.value = [
                {
                    id: `stk-${Date.now()}`,
                    medicineName: payload.medicineName,
                    supplier: payload.supplier,
                    batchNumber: payload.batchNumber,
                    expiredDate: payload.expiredDate,
                    quantity: payload.quantity,
                    minimumStock: 20,
                    unit: 'unit',
                    updatedAt: now,
                },
                ...stocks.value,
            ]
        }

        movements.value = [
            {
                id: `mov-${Date.now()}`,
                type: 'Incoming',
                medicineName: payload.medicineName,
                quantity: payload.quantity,
                reasonOrSupplier: payload.supplier,
                reference: `IN-${Date.now()}`,
                note: payload.note,
                createdAt: now,
                batchNumber: payload.batchNumber,
                expiredDate: payload.expiredDate,
            },
            ...movements.value,
        ]
    }

    const addOutgoingStock = (payload: {
        medicineName: string
        reason: StockReason
        quantity: number
        note: string
    }) => {
        const stock = stocks.value.find((item) => item.medicineName === payload.medicineName)
        const now = new Date().toISOString()

        if (stock) {
            stocks.value = stocks.value.map((item) => (
                item.id === stock.id
                    ? { ...item, quantity: Math.max(0, item.quantity - payload.quantity), updatedAt: now }
                    : item
            ))
        }

        movements.value = [
            {
                id: `mov-${Date.now()}`,
                type: 'Outgoing',
                medicineName: payload.medicineName,
                quantity: payload.quantity,
                reasonOrSupplier: payload.reason,
                reference: `OUT-${Date.now()}`,
                note: payload.note,
                createdAt: now,
                batchNumber: stock?.batchNumber ?? '-',
                expiredDate: stock?.expiredDate ?? now,
            },
            ...movements.value,
        ]
    }

    return {
        prescriptions,
        stocks,
        movements,
        summary,
        lowStockItems,
        recentPrescriptions,
        recentMovements,
        updatePrescriptionStatus,
        addPrescriptionNote,
        upsertStockMedicine,
        adjustStock,
        addIncomingStock,
        addOutgoingStock,
    }
}

export default usePharmacyWorkspace
