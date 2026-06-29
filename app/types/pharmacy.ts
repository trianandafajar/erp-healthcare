export type PrescriptionStatus = 'Pending' | 'Verified' | 'Rejected' | 'Dispensed'
export type StockMovementType = 'Incoming' | 'Outgoing'
export type StockReason = 'Damaged' | 'Expired' | 'Manual Adjustment' | 'Transfer'

export type PrescriptionItem = {
    id: string
    patientName: string
    mrn: string
    doctorName: string
    medicines: string[]
    dosage?: string | null
    frequency?: string | null
    duration?: string | null
    instructions?: string | null
    note: string
    priority: 'Low' | 'Medium' | 'High'
    status: PrescriptionStatus
    requestedAt: string
    verifiedAt?: string | null
    dispensedAt?: string | null
    pharmacistNote?: string | null
    rejectionNote?: string | null
}

export type StockItem = {
    id: string
    medicineName: string
    dosage: string
    supplier: string
    batchNumber: string
    expiredDate: string
    quantity: number
    minimumStock: number
    unit: string
    updatedAt: string
}

export type StockMovementItem = {
    id: string
    type: StockMovementType
    medicineStockId?: string | null
    medicineName: string
    dosage: string
    quantity: number
    reasonOrSupplier: string
    reference: string
    note: string
    createdAt: string
    batchNumber: string
    expiredDate: string
    performedBy?: string | null
}
