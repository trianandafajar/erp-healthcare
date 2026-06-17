import { computed } from 'vue'
import { createInitialPrescriptions } from '~/data/pharmacy'
import type { PrescriptionItem, PrescriptionStatus, StockReason, StockItem, StockMovementItem } from '~/types/pharmacy'

const usePharmacyWorkspace = () => {
    const prescriptions = useState<PrescriptionItem[]>('pharmacy-prescriptions', createInitialPrescriptions)

    const {
        data: stockData,
        pending: stockPending,
        error: stockError,
        refresh: refreshStocks,
    } = useFetch<StockItem[]>('/api/pharmacy/stocks', {
        key: 'pharmacy-stocks-feed',
        default: () => [],
    })

    const {
        data: movementData,
        pending: movementPending,
        error: movementError,
        refresh: refreshMovements,
    } = useFetch<StockMovementItem[]>('/api/pharmacy/stock-movements', {
        key: 'pharmacy-stock-movements-feed',
        default: () => [],
    })

    const stocks = computed(() => stockData.value ?? [])
    const movements = computed(() => movementData.value ?? [])

    const summary = computed(() => ({
        incomingCount: prescriptions.value.filter((item) => item.status === 'Pending').length,
        verifiedCount: prescriptions.value.filter((item) => item.status === 'Verified').length,
        dispensedCount: prescriptions.value.filter((item) => item.status === 'Dispensed').length,
        lowStockCount: stocks.value.filter((item) => item.quantity <= item.minimumStock).length,
        incomingMovementCount: movements.value.filter((item) => item.type === 'Incoming').length,
        outgoingMovementCount: movements.value.filter((item) => item.type === 'Outgoing').length,
    }))

    const lowStockItems = computed(() => stocks.value.filter((item) => item.quantity <= item.minimumStock))
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

    const upsertStockMedicine = async (payload: Partial<StockItem> & {
        medicineName: string
        dosage: string
        supplier: string
        batchNumber: string
        expiredDate: string
        quantity: number
        minimumStock: number
        unit: string
    }) => {
        const record = await $fetch<StockItem>('/api/pharmacy/stocks', {
            method: 'POST',
            body: payload,
        })

        await refreshStocks()
        await refreshMovements()
        return record
    }

    const adjustStock = async (id: string, quantityDelta: number) => {
        await $fetch(`/api/pharmacy/stocks/${id}/adjust`, {
            method: 'POST',
            body: { quantityDelta },
        })

        await refreshStocks()
        await refreshMovements()
    }

    const addIncomingStock = async (payload: {
        stockId?: string | null
        medicineName: string
        dosage: string
        supplier: string
        batchNumber: string
        expiredDate: string
        quantity: number
        note: string
    }) => {
        await $fetch('/api/pharmacy/stock-movements', {
            method: 'POST',
            body: {
                type: 'Incoming',
                ...payload,
            },
        })

        await refreshStocks()
        await refreshMovements()
    }

    const addOutgoingStock = async (payload: {
        stockId?: string | null
        medicineName: string
        dosage: string
        reason: StockReason
        quantity: number
        note: string
    }) => {
        await $fetch('/api/pharmacy/stock-movements', {
            method: 'POST',
            body: {
                type: 'Outgoing',
                ...payload,
            },
        })

        await refreshStocks()
        await refreshMovements()
    }

    return {
        prescriptions,
        stocks,
        movements,
        summary,
        lowStockItems,
        recentPrescriptions,
        recentMovements,
        stockPending,
        movementPending,
        stockError,
        movementError,
        refreshStocks,
        refreshMovements,
        updatePrescriptionStatus,
        addPrescriptionNote,
        upsertStockMedicine,
        adjustStock,
        addIncomingStock,
        addOutgoingStock,
    }
}

export default usePharmacyWorkspace
