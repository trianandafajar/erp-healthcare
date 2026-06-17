import { computed } from 'vue'
import {
    createReceptionistAppointments,
    createReceptionistBilling,
    createReceptionistDoctorSchedules,
    createReceptionistPatients,
    createReceptionistQueue,
    type AppointmentStatus,
    type BillingStatus,
    type QueueStatus,
    type ReceptionistAppointment,
    type ReceptionistBillingItem,
    type ReceptionistDoctorSchedule,
    type ReceptionistPatient,
    type ReceptionistQueueItem,
    type ScheduleStatus,
} from '~/data/receptionist'

const useReceptionistWorkspace = () => {
    const patients = useState<ReceptionistPatient[]>('receptionist-patients', createReceptionistPatients)
    const appointments = useState<ReceptionistAppointment[]>('receptionist-appointments', createReceptionistAppointments)
    const queue = useState<ReceptionistQueueItem[]>('receptionist-queue', createReceptionistQueue)
    const doctorSchedules = useState('receptionist-doctor-schedules', createReceptionistDoctorSchedules)
    const billing = useState<ReceptionistBillingItem[]>('receptionist-billing', createReceptionistBilling)

    const today = '2026-06-17'

    const summary = computed(() => ({
        registeredToday: patients.value.filter((item) => item.registeredAt.startsWith(today)).length,
        appointmentsToday: appointments.value.filter((item) => item.appointmentDate === today).length,
        checkedIn: appointments.value.filter((item) => item.status === 'Checked In' || item.status === 'Waiting').length,
        activeQueue: queue.value.filter((item) => item.status !== 'Done' && item.status !== 'Skipped').length,
        doctorsAvailable: doctorSchedules.value.filter((item) => item.status === 'Available' || item.status === 'Limited').length,
        completed: appointments.value.filter((item) => item.status === 'Completed').length,
        pendingBilling: billing.value.filter((item) => item.status === 'Pending' || item.status === 'Overdue').length,
    }))

    const upcomingAppointments = computed(() => appointments.value.filter((item) => item.status !== 'Completed' && item.status !== 'Cancelled'))
    const waitingQueue = computed(() => queue.value.filter((item) => item.status === 'Waiting'))

    const registerPatient = (payload: Omit<ReceptionistPatient, 'id' | 'medicalRecordNumber' | 'registeredAt'>) => {
        const nextNumber = String(patients.value.length + 24001).padStart(5, '0')
        const patient: ReceptionistPatient = {
            ...payload,
            id: `pat-${Date.now()}`,
            medicalRecordNumber: `MRN-${nextNumber}`,
            registeredAt: new Date().toISOString(),
        }

        patients.value = [patient, ...patients.value]
        return patient
    }

    const createAppointment = (payload: Omit<ReceptionistAppointment, 'id' | 'status'>) => {
        const appointment: ReceptionistAppointment = {
            ...payload,
            id: `apt-${Date.now()}`,
            status: 'Scheduled',
        }

        appointments.value = [appointment, ...appointments.value]
        return appointment
    }

    const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
        appointments.value = appointments.value.map((item) => (item.id === id ? { ...item, status } : item))
    }

    const updateQueueStatus = (id: string, status: QueueStatus) => {
        queue.value = queue.value.map((item) => (item.id === id ? { ...item, status } : item))
    }

    const updateBillingStatus = (id: string, status: BillingStatus) => {
        billing.value = billing.value.map((item) => (item.id === id ? { ...item, status } : item))
    }

    const createDoctorSchedule = (payload: Omit<ReceptionistDoctorSchedule, 'id'>) => {
        const schedule: ReceptionistDoctorSchedule = {
            ...payload,
            id: `sch-${Date.now()}`,
        }

        doctorSchedules.value = [schedule, ...doctorSchedules.value]
        return schedule
    }

    const updateDoctorSchedule = (id: string, payload: Omit<ReceptionistDoctorSchedule, 'id'>) => {
        doctorSchedules.value = doctorSchedules.value.map((item) => (item.id === id ? { ...payload, id } : item))
    }

    const updateDoctorScheduleStatus = (id: string, status: ScheduleStatus) => {
        doctorSchedules.value = doctorSchedules.value.map((item) => (item.id === id ? { ...item, status } : item))
    }

    const deleteDoctorSchedule = (id: string) => {
        doctorSchedules.value = doctorSchedules.value.filter((item) => item.id !== id)
    }

    const checkInAppointment = (appointmentId: string) => {
        const appointment = appointments.value.find((item) => item.id === appointmentId)
        if (!appointment) return null

        updateAppointmentStatus(appointmentId, 'Checked In')

        const prefix = appointment.department.charAt(0).toUpperCase()
        const queueNumber = `${prefix}${String(queue.value.length + 1).padStart(3, '0')}`
        const item: ReceptionistQueueItem = {
            id: `que-${Date.now()}`,
            queueNumber,
            patientName: appointment.patientName,
            medicalRecordNumber: appointment.medicalRecordNumber,
            doctorName: appointment.doctorName,
            department: appointment.department,
            appointmentTime: appointment.appointmentTime,
            status: 'Waiting',
            checkedInAt: new Date().toISOString(),
        }

        queue.value = [item, ...queue.value]
        return item
    }

    return {
        patients,
        appointments,
        queue,
        doctorSchedules,
        billing,
        summary,
        upcomingAppointments,
        waitingQueue,
        registerPatient,
        createAppointment,
        updateAppointmentStatus,
        updateQueueStatus,
        updateBillingStatus,
        createDoctorSchedule,
        updateDoctorSchedule,
        updateDoctorScheduleStatus,
        deleteDoctorSchedule,
        checkInAppointment,
    }
}

export default useReceptionistWorkspace
