export interface PatientProfile {
    fullName: string
    medicalRecordNumber: string
    email: string
    phone: string
    gender: string
    dateOfBirth: string
    bloodType: string
    address: string
    status: 'Active' | 'Inactive'
}

export interface VisitHistoryItem {
    id: string
    date: string
    doctor: string
    department: string
    complaint: string
    status: 'Completed' | 'Scheduled' | 'Cancelled'
    visitType: string
    queueNumber: string
    notes: string
    vitalSigns: {
        bloodPressure: string
        heartRate: string
        temperature: string
    }
    followUp: string
}

export interface DiagnosisItem {
    id: string
    date: string
    doctor: string
    diagnosis: string
    code: string
    notes: string
    department: string
    severity: 'Low' | 'Moderate' | 'High'
    symptoms: string[]
    findings: string[]
    carePlan: string[]
    followUp: string
}

export interface PrescriptionMedicationItem {
    medication: string
    dosage: string
    frequency: string
    duration: string
    route: string
    instructions: string[]
    warnings: string[]
    refills: number
    indication: string
}

export interface PrescriptionItem {
    id: string
    prescribedAt: string
    doctor: string
    department: string
    visitReference: string
    status: 'Active' | 'Completed' | 'Expired'
    medications: PrescriptionMedicationItem[]
}

export interface DoctorScheduleItem {
    id: string
    doctor: string
    specialty: string
    department: string
    day: string
    time: string
    slots: number
}

export interface ExaminationResultItem {
    id: string
    date: string
    type: string
    doctor: string
    status: 'Ready' | 'Pending'
    fileName: string
    department: string
    summary: string
    requestedBy: string
    notes: string
}

export interface PaymentItem {
    id: string
    invoiceNumber: string
    serviceDate: string
    serviceName: string
    amount: number
    status: 'Paid' | 'Pending' | 'Overdue'
}

export const usePatientPortalMock = () => {
    const profile: PatientProfile = {
        fullName: 'Fitriadi Patient',
        medicalRecordNumber: 'RM-2026-00021',
        email: 'work.fitriadi@gmail.com',
        phone: '+62 812-3456-7890',
        gender: 'Male',
        dateOfBirth: '1995-08-18',
        bloodType: 'O',
        address: 'Jl. Melati No. 24, Bandung',
        status: 'Active'
    }

    const visits: VisitHistoryItem[] = [
        {
            id: 'VIS-1001',
            date: '2026-06-12',
            doctor: 'Dr. Sarah Wijaya',
            department: 'Internal Medicine',
            complaint: 'Recurring headache and fatigue',
            status: 'Completed',
            visitType: 'Consultation',
            queueNumber: 'A-12',
            notes: 'Patient arrived on time and completed the visit without escalation.',
            vitalSigns: {
                bloodPressure: '120/80 mmHg',
                heartRate: '78 bpm',
                temperature: '36.7 C'
            },
            followUp: 'Improve hydration and return if symptoms persist within two weeks.'
        },
        {
            id: 'VIS-1002',
            date: '2026-06-20',
            doctor: 'Dr. Kevin Hartanto',
            department: 'Cardiology',
            complaint: 'Routine blood pressure control',
            status: 'Scheduled',
            visitType: 'Follow-up',
            queueNumber: 'B-03',
            notes: 'Scheduled follow-up for cardiovascular monitoring.',
            vitalSigns: {
                bloodPressure: '-',
                heartRate: '-',
                temperature: '-'
            },
            followUp: 'Bring the latest blood pressure record to the appointment.'
        },
        {
            id: 'VIS-1003',
            date: '2026-05-18',
            doctor: 'Dr. Dinda Prasetyo',
            department: 'General Practice',
            complaint: 'Mild fever and sore throat',
            status: 'Completed',
            visitType: 'General Check-up',
            queueNumber: 'C-07',
            notes: 'Symptoms improved after conservative treatment and rest at home.',
            vitalSigns: {
                bloodPressure: '118/76 mmHg',
                heartRate: '82 bpm',
                temperature: '37.5 C'
            },
            followUp: 'Return if fever or throat pain worsens.'
        }
    ]

    const diagnoses: DiagnosisItem[] = [
        {
            id: 'DIA-1001',
            date: '2026-06-12',
            doctor: 'Dr. Sarah Wijaya',
            diagnosis: 'Tension-type headache',
            code: 'G44.2',
            notes: 'Symptoms were consistent with stress-related headache without neurological warning signs.',
            department: 'Internal Medicine',
            severity: 'Moderate',
            symptoms: ['Recurring headache', 'Fatigue', 'Neck stiffness'],
            findings: ['Normal blood pressure', 'No fever', 'Neurological exam within normal limits'],
            carePlan: ['Improve sleep hygiene', 'Increase daily hydration', 'Monitor symptom frequency for 2 weeks'],
            followUp: 'Return if headache becomes more frequent, severe, or associated with nausea or blurred vision.'
        },
        {
            id: 'DIA-1002',
            date: '2026-05-18',
            doctor: 'Dr. Dinda Prasetyo',
            diagnosis: 'Upper respiratory tract infection',
            code: 'J06.9',
            notes: 'Mild non-complicated upper respiratory infection with stable overall condition.',
            department: 'General Practice',
            severity: 'Low',
            symptoms: ['Mild fever', 'Sore throat', 'Runny nose'],
            findings: ['No shortness of breath', 'Good oxygen saturation', 'Mild throat inflammation'],
            carePlan: ['Rest at home', 'Drink warm fluids', 'Use symptomatic relief as prescribed'],
            followUp: 'Seek care if fever lasts more than 3 days or breathing symptoms appear.'
        }
    ]

    const prescriptions: PrescriptionItem[] = [
        {
            id: 'RX-1001',
            prescribedAt: '2026-06-12',
            doctor: 'Dr. Sarah Wijaya',
            department: 'Internal Medicine',
            visitReference: 'VIS-1001',
            status: 'Active',
            medications: [
                {
                    medication: 'Paracetamol 500 mg',
                    dosage: '1 tablet',
                    frequency: '3 times a day',
                    duration: '5 days',
                    route: 'Oral',
                    instructions: ['Take after meals', 'Keep a minimum 4-hour interval between doses', 'Drink enough water'],
                    warnings: ['Do not exceed the recommended daily dose', 'Avoid combining with other paracetamol products'],
                    refills: 0,
                    indication: 'Headache and mild pain relief'
                },
                {
                    medication: 'Ibuprofen 200 mg',
                    dosage: '1 tablet',
                    frequency: '2 times a day if needed',
                    duration: '3 days',
                    route: 'Oral',
                    instructions: ['Take after meals', 'Use only when headache persists after rest'],
                    warnings: ['Avoid use on an empty stomach', 'Stop and consult a doctor if stomach pain occurs'],
                    refills: 0,
                    indication: 'Additional pain relief for persistent headache'
                }
            ]
        },
        {
            id: 'RX-1002',
            prescribedAt: '2026-05-18',
            doctor: 'Dr. Dinda Prasetyo',
            department: 'General Practice',
            visitReference: 'VIS-1003',
            status: 'Completed',
            medications: [
                {
                    medication: 'Cetirizine 10 mg',
                    dosage: '1 tablet',
                    frequency: '1 time a day',
                    duration: '3 days',
                    route: 'Oral',
                    instructions: ['Take at night if drowsiness occurs', 'Use consistently during treatment period'],
                    warnings: ['Use caution before driving if sleepy', 'Avoid alcohol while taking this medication'],
                    refills: 0,
                    indication: 'Allergy and cold-related symptom relief'
                },
                {
                    medication: 'Vitamin C 500 mg',
                    dosage: '1 tablet',
                    frequency: '1 time a day',
                    duration: '5 days',
                    route: 'Oral',
                    instructions: ['Take after breakfast'],
                    warnings: ['Do not exceed the suggested dose unless directed by a doctor'],
                    refills: 0,
                    indication: 'Supportive recovery supplement'
                }
            ]
        }
    ]

    const doctorSchedules: DoctorScheduleItem[] = [
        {
            id: 'DOC-1',
            doctor: 'Dr. Sarah Wijaya',
            specialty: 'Internal Medicine',
            department: 'Internal Medicine',
            day: 'Monday',
            time: '09:00 - 12:00',
            slots: 8
        },
        {
            id: 'DOC-2',
            doctor: 'Dr. Kevin Hartanto',
            specialty: 'Cardiology',
            department: 'Cardiology',
            day: 'Wednesday',
            time: '13:00 - 16:00',
            slots: 5
        },
        {
            id: 'DOC-3',
            doctor: 'Dr. Dinda Prasetyo',
            specialty: 'General Practice',
            department: 'General Practice',
            day: 'Friday',
            time: '08:00 - 11:00',
            slots: 10
        }
    ]

    const examinationResults: ExaminationResultItem[] = [
        {
            id: 'EX-1001',
            date: '2026-06-12',
            type: 'General Examination Summary',
            doctor: 'Dr. Sarah Wijaya',
            status: 'Ready',
            fileName: 'general-examination-summary-june-12.pdf',
            department: 'Internal Medicine',
            summary: 'General examination summary with stable vital signs and no neurological red flags.',
            requestedBy: 'Dr. Sarah Wijaya',
            notes: 'Patient advised to rest, hydrate well, and monitor symptom pattern.'
        },
        {
            id: 'EX-1002',
            date: '2026-06-10',
            type: 'Complete Blood Count',
            doctor: 'Dr. Sarah Wijaya',
            status: 'Ready',
            fileName: 'cbc-result-june-10.pdf',
            department: 'Internal Medicine',
            summary: 'CBC values are within normal range with no sign of acute infection.',
            requestedBy: 'Dr. Sarah Wijaya',
            notes: 'No immediate action required based on laboratory review.'
        },
        {
            id: 'EX-1003',
            date: '2026-06-20',
            type: 'ECG Result',
            doctor: 'Dr. Kevin Hartanto',
            status: 'Pending',
            fileName: 'ecg-result-june-20.pdf',
            department: 'Cardiology',
            summary: 'ECG interpretation is still under review by the attending cardiologist.',
            requestedBy: 'Dr. Kevin Hartanto',
            notes: 'Result will be available after the scheduled follow-up visit.'
        }
    ]

    const payments: PaymentItem[] = [
        {
            id: 'PAY-1001',
            invoiceNumber: 'INV-2026-00021',
            serviceDate: '2026-06-12',
            serviceName: 'General Consultation',
            amount: 250000,
            status: 'Pending'
        },
        {
            id: 'PAY-1002',
            invoiceNumber: 'INV-2026-00016',
            serviceDate: '2026-05-18',
            serviceName: 'Medication and Consultation',
            amount: 375000,
            status: 'Paid'
        },
        {
            id: 'PAY-1003',
            invoiceNumber: 'INV-2026-00009',
            serviceDate: '2026-04-02',
            serviceName: 'Laboratory Test',
            amount: 420000,
            status: 'Overdue'
        }
    ]

    const summary = {
        totalVisits: visits.length,
        activePrescriptions: prescriptions.filter((item) => item.status === 'Active').length,
        unpaidBills: payments.filter((item) => item.status !== 'Paid').length,
        upcomingAppointment: visits.find((item) => item.status === 'Scheduled') ?? null
    }

    return {
        profile,
        visits,
        diagnoses,
        prescriptions,
        doctorSchedules,
        examinationResults,
        payments,
        summary
    }
}
