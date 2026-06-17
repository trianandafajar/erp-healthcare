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
    medicineName: string
    quantity: number
    reasonOrSupplier: string
    reference: string
    note: string
    createdAt: string
    batchNumber: string
    expiredDate: string
}

export const initialPrescriptions: PrescriptionItem[] = [
    {
        id: 'rx-001',
        patientName: 'Siti Aisyah',
        mrn: 'RM-2026-00012',
        doctorName: 'Dr. Andi Pratama',
        medicines: ['Amoxicillin 500 mg', 'Vitamin C 500 mg'],
        note: 'Post-operative antibiotic course',
        priority: 'High',
        status: 'Pending',
        requestedAt: '2026-06-16T08:15:00.000Z',
        pharmacistNote: null,
    },
    {
        id: 'rx-002',
        patientName: 'Budi Santoso',
        mrn: 'RM-2026-00013',
        doctorName: 'Dr. Kevin Hartanto',
        medicines: ['Paracetamol 500 mg'],
        note: 'Pain and fever management',
        priority: 'Medium',
        status: 'Verified',
        requestedAt: '2026-06-16T08:40:00.000Z',
        verifiedAt: '2026-06-16T09:00:00.000Z',
        pharmacistNote: 'Checked dose and frequency.',
    },
    {
        id: 'rx-003',
        patientName: 'Rina Permata',
        mrn: 'RM-2026-00014',
        doctorName: 'Dr. Sarah Wijaya',
        medicines: ['Ondansetron 4 mg'],
        note: 'Nausea control',
        priority: 'Low',
        status: 'Dispensed',
        requestedAt: '2026-06-16T09:05:00.000Z',
        verifiedAt: '2026-06-16T09:25:00.000Z',
        dispensedAt: '2026-06-16T09:40:00.000Z',
        pharmacistNote: 'Dispensed with patient counseling.',
    },
    {
        id: 'rx-004',
        patientName: 'Andi Pratama',
        mrn: 'RM-2026-00015',
        doctorName: 'Dr. Dinda Prasetyo',
        medicines: ['Ranitidine 150 mg'],
        note: 'Gastric protection',
        priority: 'Medium',
        status: 'Pending',
        requestedAt: '2026-06-16T09:30:00.000Z',
        pharmacistNote: null,
    },
]

export const initialStocks: StockItem[] = [
    {
        id: 'stk-001',
        medicineName: 'Amoxicillin 500 mg',
        supplier: 'PT Medika Prima',
        batchNumber: 'B-AX-2606',
        expiredDate: '2027-06-30T00:00:00.000Z',
        quantity: 48,
        minimumStock: 20,
        unit: 'capsule',
        updatedAt: '2026-06-16T08:45:00.000Z',
    },
    {
        id: 'stk-002',
        medicineName: 'Paracetamol 500 mg',
        supplier: 'PT Sehat Sentosa',
        batchNumber: 'B-PR-2606',
        expiredDate: '2027-02-28T00:00:00.000Z',
        quantity: 128,
        minimumStock: 30,
        unit: 'tablet',
        updatedAt: '2026-06-16T08:45:00.000Z',
    },
    {
        id: 'stk-003',
        medicineName: 'Ondansetron 4 mg',
        supplier: 'PT Maju Farma',
        batchNumber: 'B-ON-2605',
        expiredDate: '2026-12-31T00:00:00.000Z',
        quantity: 11,
        minimumStock: 15,
        unit: 'tablet',
        updatedAt: '2026-06-16T08:45:00.000Z',
    },
    {
        id: 'stk-004',
        medicineName: 'Ranitidine 150 mg',
        supplier: 'PT Karya Sehat',
        batchNumber: 'B-RN-2605',
        expiredDate: '2026-11-30T00:00:00.000Z',
        quantity: 19,
        minimumStock: 20,
        unit: 'tablet',
        updatedAt: '2026-06-16T08:45:00.000Z',
    },
]

export const initialMovements: StockMovementItem[] = [
    {
        id: 'mov-001',
        type: 'Incoming',
        medicineName: 'Paracetamol 500 mg',
        quantity: 200,
        reasonOrSupplier: 'PT Medika Prima',
        reference: 'GRN-260616-01',
        note: 'Restocked for ward requests',
        createdAt: '2026-06-16T07:20:00.000Z',
        batchNumber: 'B-PR-2606',
        expiredDate: '2027-02-28T00:00:00.000Z',
    },
    {
        id: 'mov-002',
        type: 'Outgoing',
        medicineName: 'Amoxicillin 500 mg',
        quantity: 24,
        reasonOrSupplier: 'Dispensed to Ward A',
        reference: 'ISS-260616-02',
        note: 'Postoperative patient supply',
        createdAt: '2026-06-16T09:10:00.000Z',
        batchNumber: 'B-AX-2606',
        expiredDate: '2027-06-30T00:00:00.000Z',
    },
    {
        id: 'mov-003',
        type: 'Incoming',
        medicineName: 'Ondansetron 4 mg',
        quantity: 50,
        reasonOrSupplier: 'PT Sehat Sentosa',
        reference: 'GRN-260615-03',
        note: 'Small batch top-up',
        createdAt: '2026-06-15T13:30:00.000Z',
        batchNumber: 'B-ON-2605',
        expiredDate: '2026-12-31T00:00:00.000Z',
    },
]

export const createInitialPrescriptions = () => initialPrescriptions.map((item) => ({
    ...item,
    medicines: [...item.medicines],
}))

export const createInitialStocks = () => initialStocks.map((item) => ({ ...item }))
export const createInitialMovements = () => initialMovements.map((item) => ({ ...item }))
