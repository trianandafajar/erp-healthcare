<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

interface CalendarAppointment {
    id: string
    patient_id: string
    appointment_date: string
    appointment_time: string
    type: string
    status: string
    chief_complaint: string | null
    notes: string | null
    queue_number: string | null
    created_at: string
    patients: {
        full_name: string | null
        medical_record_number: string | null
    } | null
}

function statusColor(status: string) {
    const map: Record<string, string> = {
        waiting: 'warning',
        in_progress: 'info',
        done: 'success',
        cancelled: 'error',
    }
    return map[status] ?? 'default'
}

function statusVariant(status: string) {
    return status === 'done' || status === 'cancelled' ? 'flat' : 'tonal'
}

const calendarRef = ref<any>(null)
const calendarTitle = ref('')
const selectedDateKey = ref('')
const appointments = ref<CalendarAppointment[]>([])
const loading = ref(false)
const viewTab = ref<'calendar' | 'table'>('calendar')
const { getSignal } = useAbortController()

onMounted(() => {
    loadAppointments(toDateKey(new Date()))
})

const calendarEvents = computed(() =>
    appointments.value.map((appt) => {
        const time = (appt.appointment_time ?? '').slice(0, 5)
        const color = statusColor(appt.status)
        return {
            id: appt.id,
            title: appt.patients?.full_name ?? 'Patient',
            start: `${selectedDateKey.value}T${time}:00`,
            backgroundColor: color,
            borderColor: color,
            textColor: '#fff',
            extendedProps: {
                id: appt.id,
                patientName: appt.patients?.full_name ?? 'Patient',
                mrn: appt.patients?.medical_record_number ?? null,
                time,
                status: appt.status,
                type: appt.type,
                queueNumber: appt.queue_number,
                complaint: appt.chief_complaint,
            },
        }
    }),
)

const calendarOptions = computed(() => ({
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridDay',
    headerToolbar: false,
    events: calendarEvents.value,
    height: 'auto',
    nowIndicator: true,
    firstDay: 0,
    allDaySlot: false,
    slotMinTime: '00:00:00',
    slotMaxTime: '23:59:59',
    datesSet: handleDatesSet,
    eventDidMount: handleEventDidMount,
}))

function toDateKey(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

async function handleDatesSet(info: any) {
    const dateKey = toDateKey(info.view.currentStart)
    calendarTitle.value = info.view.title
    await loadAppointments(dateKey)
}

async function loadAppointments(dateKey: string) {
    selectedDateKey.value = dateKey
    appointments.value = []
    loading.value = true
    try {
        const res = await $fetch<{ appointments: CalendarAppointment[] }>('/api/doctor/appointments', {
            query: { date: dateKey },
            signal: getSignal(),
        })
        appointments.value = res.appointments ?? []
    } catch {
        appointments.value = []
    } finally {
        loading.value = false
    }
}

function handleEventDidMount(info: any) {
    info.el.style.pointerEvents = 'none'
}

function prevDay() {
    calendarRef.value?.getApi?.().prev()
}

function nextDay() {
    calendarRef.value?.getApi?.().next()
}

function goToday() {
    calendarRef.value?.getApi?.().today()
}

function formatTime(time: string) {
    const parts = (time ?? '').split(':')
    if (parts.length < 2) return '-'
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (Number.isNaN(h) || Number.isNaN(m)) return '-'
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

const selectedDateLabel = computed(() => {
    if (!selectedDateKey.value) return ''
    const d = new Date(selectedDateKey.value + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
})

const statusLegend = [
    { status: 'waiting', color: 'warning', label: 'Waiting' },
    { status: 'in_progress', color: 'info', label: 'In Progress' },
    { status: 'done', color: 'success', label: 'Done' },
    { status: 'cancelled', color: 'error', label: 'Cancelled' },
]
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div class="d-flex justify-space-between align-center flex-wrap ga-3">
            <div>
                <v-card-title class="text-h3">Appointments Calendar</v-card-title>
                <v-card-subtitle class="mt-1">View all appointments for the selected day</v-card-subtitle>
            </div>
        </div>
    </v-card-item>

    <v-tabs v-model="viewTab" color="primary" density="comfortable" grow class="mb-3">
        <v-tab value="calendar" prepend-icon="mdi-calendar-month">Kalender</v-tab>
        <v-tab value="table" prepend-icon="mdi-table">Tabel</v-tab>
    </v-tabs>

    <v-window v-model="viewTab">
        <v-window-item value="calendar">
            <UiTitleCard class-name="px-0 pb-0 rounded-md">
                <div class="calendar-shell pa-4">
                    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
                        <div class="d-flex align-center ga-2">
                            <v-btn icon="mdi-chevron-left" variant="flat" color="primary" density="comfortable"
                                @click="prevDay" />
                            <v-btn icon="mdi-chevron-right" variant="flat" color="primary" density="comfortable"
                                @click="nextDay" />
                            <v-btn variant="tonal" color="secondary" density="comfortable" @click="goToday">
                                Today
                            </v-btn>
                        </div>

                        <div class="text-subtitle-1 font-weight-bold">{{ calendarTitle }}</div>

                        <div class="d-flex flex-wrap align-center ga-2">
                            <v-chip v-for="item in statusLegend" :key="item.status" :color="item.color"
                                :variant="item.status === 'done' || item.status === 'cancelled' ? 'flat' : 'tonal'" size="small"
                                label>
                                {{ item.label }}
                            </v-chip>
                        </div>
                    </div>

                    <FullCalendar ref="calendarRef" :options="calendarOptions">
                        <template #eventContent="arg">
                            <div class="calendar-event">
                                <div class="calendar-event-title">{{ arg.event.extendedProps.patientName }}</div>
                                <div class="calendar-event-subtitle">{{ arg.event.extendedProps.time }}</div>
                            </div>
                        </template>
                    </FullCalendar>
                </div>
            </UiTitleCard>
        </v-window-item>

        <v-window-item value="table">
            <UiTitleCard class-name="px-0 pb-0 rounded-md">
                <div class="d-flex flex-wrap align-center justify-space-between ga-2 px-4 pt-4">
                    <div>
                        <v-card-title class="text-h5">Appointments</v-card-title>
                        <v-card-subtitle class="mt-1">
                            {{ selectedDateLabel || 'Select a date' }}
                        </v-card-subtitle>
                    </div>
                    <div class="d-flex align-center ga-2">
                        <v-btn icon="mdi-chevron-left" variant="flat" color="primary" density="comfortable"
                            @click="prevDay" />
                        <v-btn icon="mdi-chevron-right" variant="flat" color="primary" density="comfortable"
                            @click="nextDay" />
                        <v-btn variant="tonal" color="secondary" density="comfortable" @click="goToday">
                            Today
                        </v-btn>
                        <v-chip color="primary" variant="tonal" v-if="!loading">
                            {{ appointments.length }} appointment{{ appointments.length === 1 ? '' : 's' }}
                        </v-chip>
                    </div>
                </div>

                <v-table class="bordered-table" hover density="comfortable">
                    <thead class="bg-containerBg">
                        <tr>
                            <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Time</th>
                            <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Queue</th>
                            <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Patient</th>
                            <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Type</th>
                            <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                            <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Chief Complaint</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="loading">
                            <td colspan="6" class="text-center py-8">
                                <v-progress-circular indeterminate color="primary" />
                            </td>
                        </tr>
                        <tr v-else-if="appointments.length === 0">
                            <td colspan="6" class="text-center py-8 text-medium-emphasis">
                                <v-icon icon="mdi-calendar-blank" size="32" class="mb-2 d-block mx-auto" />
                                No appointments on this date
                            </td>
                        </tr>
                        <tr v-else v-for="appt in appointments" :key="appt.id">
                            <td class="py-3 text-body-2 font-weight-medium">{{ formatTime(appt.appointment_time) }}</td>
                            <td class="py-3 text-body-2">{{ appt.queue_number ?? '-' }}</td>
                            <td class="py-3">
                                <div class="text-body-2 font-weight-medium">{{ appt.patients?.full_name ?? 'Patient' }}</div>
                                <div class="text-caption text-medium-emphasis">{{ appt.patients?.medical_record_number ?? '-' }}
                                </div>
                            </td>
                            <td class="py-3">
                                <v-chip color="secondary" variant="tonal" size="small" label>
                                    {{ appt.type }}
                                </v-chip>
                            </td>
                            <td class="py-3">
                                <v-chip :color="statusColor(appt.status)" :variant="statusVariant(appt.status)" size="small">
                                    {{ appt.status }}
                                </v-chip>
                            </td>
                            <td class="py-3 text-body-2 text-medium-emphasis">{{ appt.chief_complaint || '-' }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </UiTitleCard>
        </v-window-item>
    </v-window>
</template>

<style scoped>
.calendar-shell :deep(.fc) {
    --fc-border-color: rgba(0, 0, 0, 0.12);
    --fc-neutral-bg-color: rgb(var(--v-theme-surface));
    --fc-page-bg-color: transparent;
    --fc-today-bg-color: rgba(var(--v-theme-primary), 0.08);
    --fc-event-text-color: #fff;
}

.calendar-shell :deep(.fc .fc-toolbar) {
    display: none;
}

.calendar-shell :deep(.fc .fc-timegrid-event) {
    border-radius: 8px;
    padding: 2px 4px;
}

.calendar-shell :deep(.fc .fc-timegrid-event-harness),
.calendar-shell :deep(.fc .fc-timegrid-event-harness-inset),
.calendar-shell :deep(.fc .fc-event) {
    pointer-events: none;
}

.calendar-event {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    position: relative;
}

.calendar-event-title {
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.calendar-event-subtitle {
    font-size: 0.65rem;
    line-height: 1.2;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
