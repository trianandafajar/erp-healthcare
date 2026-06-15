import { computed } from 'vue'

type NursePatient = {
    id: string
    name: string
    mrn: string
    department: string
    room: string
    status: 'stable' | 'watch' | 'critical'
    lastUpdated: string
}

type VitalEntry = {
    id: string
    patientId: string
    patientName: string
    bloodPressure: string
    temperature: string
    weight: string
    height: string
    pulse: string
    notes: string
    recordedAt: string
}

type CareNote = {
    id: string
    patientId: string
    patientName: string
    category: string
    note: string
    author: string
    createdAt: string
}

type ProcedureItem = {
    id: string
    patientId: string
    patientName: string
    procedure: string
    scheduledAt: string
    priority: 'Low' | 'Medium' | 'High'
    status: 'Planned' | 'In Progress' | 'Completed'
}

type MonitoringItem = {
    id: string
    patientId: string
    patientName: string
    observation: string
    status: 'Stable' | 'Observe' | 'Urgent'
    lastUpdate: string
}

const initialPatients: NursePatient[] = [
    {
        id: 'pt-001',
        name: 'Siti Aisyah',
        mrn: 'MRN-2026-001',
        department: 'ICU',
        room: 'ICU-02',
        status: 'critical',
        lastUpdated: '2026-06-15T02:20:00.000Z',
    },
    {
        id: 'pt-002',
        name: 'Budi Santoso',
        mrn: 'MRN-2026-002',
        department: 'Internal Medicine',
        room: 'IM-11',
        status: 'watch',
        lastUpdated: '2026-06-15T03:05:00.000Z',
    },
    {
        id: 'pt-003',
        name: 'Rina Permata',
        mrn: 'MRN-2026-003',
        department: 'Ward A',
        room: 'WA-07',
        status: 'stable',
        lastUpdated: '2026-06-15T04:10:00.000Z',
    },
    {
        id: 'pt-004',
        name: 'Andi Pratama',
        mrn: 'MRN-2026-004',
        department: 'Post-Op',
        room: 'PO-04',
        status: 'watch',
        lastUpdated: '2026-06-15T04:40:00.000Z',
    },
]

const initialVitals: VitalEntry[] = [
    {
        id: 'vital-001',
        patientId: 'pt-001',
        patientName: 'Siti Aisyah',
        bloodPressure: '140/90',
        temperature: '38.1',
        weight: '62',
        height: '160',
        pulse: '98',
        notes: 'Needs close observation',
        recordedAt: '2026-06-15T04:30:00.000Z',
    },
]

const initialCareNotes: CareNote[] = [
    {
        id: 'note-001',
        patientId: 'pt-002',
        patientName: 'Budi Santoso',
        category: 'Medication',
        note: 'Pain score reduced after medication administration.',
        author: 'Nurse Maya',
        createdAt: '2026-06-15T04:20:00.000Z',
    },
]

const initialProcedures: ProcedureItem[] = [
    {
        id: 'proc-001',
        patientId: 'pt-004',
        patientName: 'Andi Pratama',
        procedure: 'Wound dressing change',
        scheduledAt: '2026-06-15T09:00:00.000Z',
        priority: 'High',
        status: 'Planned',
    },
]

const initialMonitoring: MonitoringItem[] = [
    {
        id: 'mon-001',
        patientId: 'pt-001',
        patientName: 'Siti Aisyah',
        observation: 'Monitor oxygen saturation and temperature every 2 hours.',
        status: 'Urgent',
        lastUpdate: '2026-06-15T04:40:00.000Z',
    },
    {
        id: 'mon-002',
        patientId: 'pt-003',
        patientName: 'Rina Permata',
        observation: 'Vitals stable, continue routine observation.',
        status: 'Stable',
        lastUpdate: '2026-06-15T03:55:00.000Z',
    },
]

const useNurseWorkspace = () => {
    const patients = useState<NursePatient[]>('nurse-patients', () => initialPatients)
    const vitals = useState<VitalEntry[]>('nurse-vitals', () => initialVitals)
    const careNotes = useState<CareNote[]>('nurse-care-notes', () => initialCareNotes)
    const procedures = useState<ProcedureItem[]>('nurse-procedures', () => initialProcedures)
    const monitoring = useState<MonitoringItem[]>('nurse-monitoring', () => initialMonitoring)

    const selectedPatientId = useState<string>('nurse-selected-patient', () => patients.value[0]?.id ?? '')

    const selectedPatient = computed(() => patients.value.find((patient) => patient.id === selectedPatientId.value) ?? patients.value[0] ?? null)

    const summary = computed(() => ({
        patientCount: patients.value.length,
        vitalCount: vitals.value.length,
        noteCount: careNotes.value.length,
        procedureCount: procedures.value.length,
        monitoringCount: monitoring.value.length,
        urgentCount: monitoring.value.filter((item) => item.status === 'Urgent').length,
    }))

    const patientOptions = computed(() => patients.value.map((patient) => ({
        title: `${patient.name} - ${patient.room}`,
        value: patient.id,
    })))

    const recentVitals = computed(() => vitals.value.filter(Boolean).slice(0, 5))
    const recentCareNotes = computed(() => careNotes.value.filter(Boolean).slice(0, 5))
    const upcomingProcedures = computed(() => procedures.value.filter(Boolean).slice(0, 5))
    const monitoringItems = computed(() => monitoring.value.filter(Boolean).slice(0, 5))

    const addVital = (payload: Omit<VitalEntry, 'id' | 'patientName' | 'recordedAt'>) => {
        const patient = patients.value.find((item) => item.id === payload.patientId)
        if (!patient) return

        vitals.value = [
            {
                id: `vital-${Date.now()}`,
                patientName: patient.name,
                recordedAt: new Date().toISOString(),
                ...payload,
            },
            ...vitals.value,
        ]
    }

    const addCareNote = (payload: Omit<CareNote, 'id' | 'patientName' | 'author' | 'createdAt'> & { author?: string }) => {
        const patient = patients.value.find((item) => item.id === payload.patientId)
        if (!patient) return

        careNotes.value = [
            {
                id: `note-${Date.now()}`,
                patientName: patient.name,
                author: payload.author ?? 'Nurse',
                createdAt: new Date().toISOString(),
                ...payload,
            },
            ...careNotes.value,
        ]
    }

    const addProcedure = (payload: Omit<ProcedureItem, 'id' | 'patientName'>) => {
        const patient = patients.value.find((item) => item.id === payload.patientId)
        if (!patient) return

        procedures.value = [
            {
                id: `proc-${Date.now()}`,
                patientName: patient.name,
                ...payload,
            },
            ...procedures.value,
        ]
    }

    const addMonitoring = (payload: Omit<MonitoringItem, 'id' | 'patientName' | 'lastUpdate'>) => {
        const patient = patients.value.find((item) => item.id === payload.patientId)
        if (!patient) return

        monitoring.value = [
            {
                id: `mon-${Date.now()}`,
                patientName: patient.name,
                lastUpdate: new Date().toISOString(),
                ...payload,
            },
            ...monitoring.value,
        ]
    }

    return {
        patients,
        vitals,
        careNotes,
        procedures,
        monitoring,
        selectedPatientId,
        selectedPatient,
        summary,
        patientOptions,
        recentVitals,
        recentCareNotes,
        upcomingProcedures,
        monitoringItems,
        addVital,
        addCareNote,
        addProcedure,
        addMonitoring,
    }
}

export default useNurseWorkspace

