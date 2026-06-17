export type QueueStatus = 'Waiting' | 'Called' | 'In Service' | 'Skipped' | 'Done'
export type AppointmentStatus = 'Scheduled' | 'Checked In' | 'Waiting' | 'Completed' | 'Cancelled'
export type ScheduleStatus = 'Available' | 'Limited' | 'Full' | 'Off Duty'
export type BillingStatus = 'Paid' | 'Pending' | 'Overdue'

export interface ReceptionistPatient {
    id: string
    medicalRecordNumber: string
    fullName: string
    gender: 'Male' | 'Female'
    dateOfBirth: string
    phone: string
    address: string
    insuranceProvider: string
    emergencyContact: string
    registeredAt: string
}

export interface ReceptionistAppointment {
    id: string
    patientId: string
    patientName: string
    medicalRecordNumber: string
    doctorName: string
    department: string
    appointmentDate: string
    appointmentTime: string
    type: string
    status: AppointmentStatus
    note: string
}

export interface ReceptionistQueueItem {
    id: string
    queueNumber: string
    patientName: string
    medicalRecordNumber: string
    doctorName: string
    department: string
    appointmentTime: string
    status: QueueStatus
    checkedInAt: string
}

export interface ReceptionistDoctorSchedule {
    id: string
    doctorName: string
    specialty: string
    department: string
    day: string
    startTime: string
    endTime: string
    room: string
    quota: number
    booked: number
    status: ScheduleStatus
}

export interface ReceptionistBillingItem {
    id: string
    invoiceNumber: string
    patientName: string
    medicalRecordNumber: string
    serviceDate: string
    serviceName: string
    department: string
    amount: number
    paymentMethod: string
    status: BillingStatus
}

export const createReceptionistPatients = (): ReceptionistPatient[] => [
    {
        id: 'pat-001',
        medicalRecordNumber: 'MRN-24001',
        fullName: 'Alicia Morgan',
        gender: 'Female',
        dateOfBirth: '1991-03-14',
        phone: '+1 555-0124',
        address: '214 Oak Street, Springfield',
        insuranceProvider: 'HealthSure',
        emergencyContact: 'Daniel Morgan - +1 555-0198',
        registeredAt: '2026-06-17T08:10:00.000Z',
    },
    {
        id: 'pat-002',
        medicalRecordNumber: 'MRN-24002',
        fullName: 'Brian Carter',
        gender: 'Male',
        dateOfBirth: '1984-09-22',
        phone: '+1 555-0172',
        address: '89 Lake Avenue, Springfield',
        insuranceProvider: 'MediPlan',
        emergencyContact: 'Rose Carter - +1 555-0145',
        registeredAt: '2026-06-17T08:35:00.000Z',
    },
    {
        id: 'pat-003',
        medicalRecordNumber: 'MRN-24003',
        fullName: 'Nadia Putri',
        gender: 'Female',
        dateOfBirth: '1997-12-02',
        phone: '+62 812-3300-1122',
        address: 'Jl. Melati No. 12, Jakarta',
        insuranceProvider: 'Self Pay',
        emergencyContact: 'Raka Putra - +62 812-4400-2211',
        registeredAt: '2026-06-17T09:05:00.000Z',
    },
]

export const createReceptionistAppointments = (): ReceptionistAppointment[] => [
    {
        id: 'apt-001',
        patientId: 'pat-001',
        patientName: 'Alicia Morgan',
        medicalRecordNumber: 'MRN-24001',
        doctorName: 'Dr. Emily Ross',
        department: 'General Medicine',
        appointmentDate: '2026-06-17',
        appointmentTime: '09:00',
        type: 'Consultation',
        status: 'Checked In',
        note: 'Follow-up consultation',
    },
    {
        id: 'apt-002',
        patientId: 'pat-002',
        patientName: 'Brian Carter',
        medicalRecordNumber: 'MRN-24002',
        doctorName: 'Dr. Michael Chen',
        department: 'Cardiology',
        appointmentDate: '2026-06-17',
        appointmentTime: '09:30',
        type: 'New Visit',
        status: 'Waiting',
        note: 'Chest discomfort screening',
    },
    {
        id: 'apt-003',
        patientId: 'pat-003',
        patientName: 'Nadia Putri',
        medicalRecordNumber: 'MRN-24003',
        doctorName: 'Dr. Sarah Lee',
        department: 'Pediatrics',
        appointmentDate: '2026-06-17',
        appointmentTime: '10:15',
        type: 'Consultation',
        status: 'Scheduled',
        note: 'Initial visit',
    },
    {
        id: 'apt-004',
        patientId: 'pat-004',
        patientName: 'Oscar Bennett',
        medicalRecordNumber: 'MRN-23988',
        doctorName: 'Dr. Emily Ross',
        department: 'General Medicine',
        appointmentDate: '2026-06-17',
        appointmentTime: '11:00',
        type: 'Control',
        status: 'Completed',
        note: 'Blood pressure control',
    },
]

export const createReceptionistQueue = (): ReceptionistQueueItem[] => [
    {
        id: 'que-001',
        queueNumber: 'A001',
        patientName: 'Alicia Morgan',
        medicalRecordNumber: 'MRN-24001',
        doctorName: 'Dr. Emily Ross',
        department: 'General Medicine',
        appointmentTime: '09:00',
        status: 'In Service',
        checkedInAt: '2026-06-17T08:45:00.000Z',
    },
    {
        id: 'que-002',
        queueNumber: 'C014',
        patientName: 'Brian Carter',
        medicalRecordNumber: 'MRN-24002',
        doctorName: 'Dr. Michael Chen',
        department: 'Cardiology',
        appointmentTime: '09:30',
        status: 'Waiting',
        checkedInAt: '2026-06-17T08:55:00.000Z',
    },
    {
        id: 'que-003',
        queueNumber: 'P007',
        patientName: 'Nadia Putri',
        medicalRecordNumber: 'MRN-24003',
        doctorName: 'Dr. Sarah Lee',
        department: 'Pediatrics',
        appointmentTime: '10:15',
        status: 'Waiting',
        checkedInAt: '2026-06-17T09:08:00.000Z',
    },
]

export const createReceptionistDoctorSchedules = (): ReceptionistDoctorSchedule[] => [
    {
        id: 'sch-001',
        doctorName: 'Dr. Emily Ross',
        specialty: 'Internal Medicine',
        department: 'General Medicine',
        day: 'Wednesday',
        startTime: '08:00',
        endTime: '14:00',
        room: 'Room 201',
        quota: 28,
        booked: 18,
        status: 'Available',
    },
    {
        id: 'sch-002',
        doctorName: 'Dr. Michael Chen',
        specialty: 'Cardiologist',
        department: 'Cardiology',
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '13:00',
        room: 'Room 308',
        quota: 16,
        booked: 14,
        status: 'Limited',
    },
    {
        id: 'sch-003',
        doctorName: 'Dr. Sarah Lee',
        specialty: 'Pediatrician',
        department: 'Pediatrics',
        day: 'Wednesday',
        startTime: '10:00',
        endTime: '16:00',
        room: 'Room 112',
        quota: 24,
        booked: 24,
        status: 'Full',
    },
    {
        id: 'sch-004',
        doctorName: 'Dr. Arman Wijaya',
        specialty: 'Neurologist',
        department: 'Neurology',
        day: 'Thursday',
        startTime: '08:00',
        endTime: '12:00',
        room: 'Room 405',
        quota: 12,
        booked: 5,
        status: 'Available',
    },
]

export const createReceptionistBilling = (): ReceptionistBillingItem[] => [
    {
        id: 'bill-001',
        invoiceNumber: 'INV-20260617-001',
        patientName: 'Alicia Morgan',
        medicalRecordNumber: 'MRN-24001',
        serviceDate: '2026-06-17',
        serviceName: 'General Consultation',
        department: 'General Medicine',
        amount: 75000,
        paymentMethod: 'Insurance',
        status: 'Paid',
    },
    {
        id: 'bill-002',
        invoiceNumber: 'INV-20260617-002',
        patientName: 'Brian Carter',
        medicalRecordNumber: 'MRN-24002',
        serviceDate: '2026-06-17',
        serviceName: 'Cardiology Screening',
        department: 'Cardiology',
        amount: 185000,
        paymentMethod: 'Self Pay',
        status: 'Pending',
    },
    {
        id: 'bill-003',
        invoiceNumber: 'INV-20260617-003',
        patientName: 'Nadia Putri',
        medicalRecordNumber: 'MRN-24003',
        serviceDate: '2026-06-17',
        serviceName: 'Pediatric Consultation',
        department: 'Pediatrics',
        amount: 95000,
        paymentMethod: 'Self Pay',
        status: 'Pending',
    },
    {
        id: 'bill-004',
        invoiceNumber: 'INV-20260616-009',
        patientName: 'Oscar Bennett',
        medicalRecordNumber: 'MRN-23988',
        serviceDate: '2026-06-16',
        serviceName: 'Blood Pressure Control',
        department: 'General Medicine',
        amount: 65000,
        paymentMethod: 'Self Pay',
        status: 'Overdue',
    },
]
