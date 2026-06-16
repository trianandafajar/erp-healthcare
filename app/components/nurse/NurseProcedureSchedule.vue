<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import useNurseWorkspace from '~/composables/useNurseWorkspace'

type ProcedureItem = {
    id: string
    patientId: string
    patientName: string
    procedure: string
    scheduledAt: string
    priority: 'Low' | 'Medium' | 'High'
    status: 'Planned' | 'In Progress' | 'Completed'
}

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

const workspace = useNurseWorkspace()
const procedures = computed<ProcedureItem[]>(() => workspace.upcomingProcedures.value.filter(Boolean) as ProcedureItem[])
const viewTab = ref<'calendar' | 'list'>('calendar')
const calendarView = ref<CalendarView>('dayGridMonth')
const calendarRef = ref<any>(null)
const selectedDateKey = ref<string | null>(null)
const dateDialog = ref(false)
const currentPage = ref(1)
const itemsPerPage = 8

const calendarEvents = computed(() =>
    procedures.value.map((procedure) => ({
        id: procedure.id,
        title: `${procedure.patientName} • ${procedure.procedure}`,
        start: procedure.scheduledAt,
        backgroundColor: getPriorityColor(procedure.priority),
        borderColor: getPriorityColor(procedure.priority),
        extendedProps: {
            patientName: procedure.patientName,
            procedure: procedure.procedure,
            priority: procedure.priority,
            status: procedure.status,
        },
    })),
)

const calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: calendarView.value,
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: '',
    },
    events: calendarEvents.value,
    height: 'auto',
    dayMaxEvents: 3,
    eventDisplay: 'block',
    nowIndicator: true,
    firstDay: 0,
    dateClick: handleDateClick,
    eventClick: handleEventClick,
}))

const totalPages = computed(() => Math.max(1, Math.ceil(procedures.value.length / itemsPerPage)))
const paginatedProcedures = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return procedures.value.slice(start, start + itemsPerPage)
})
const selectedProcedures = computed(() =>
    selectedDateKey.value ? procedures.value.filter((item) => toDateKey(item.scheduledAt) === selectedDateKey.value) : [],
)
const selectedDateLabel = computed(() => (selectedDateKey.value ? formatFriendlyDate(selectedDateKey.value) : ''))

watch(totalPages, () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
    }
})

watch(calendarView, (view) => {
    calendarRef.value?.getApi()?.changeView(view)
})

function openDateDialog(dateInput: string) {
    selectedDateKey.value = toDateKey(dateInput)
    dateDialog.value = true
}

function handleDateClick(info: { dateStr: string }) {
    openDateDialog(info.dateStr)
}

function handleEventClick(info: { event: { startStr: string } }) {
    openDateDialog(info.event.startStr)
}

function formatListDate(dateInput: string) {
    return new Date(dateInput).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function getPriorityColor(priority: ProcedureItem['priority']) {
    if (priority === 'High') return '#ef4444'
    if (priority === 'Medium') return '#f59e0b'
    return '#22c55e'
}

function toDateKey(value: string | Date) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function formatFriendlyDate(value: string) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatDialogTime(dateInput: string) {
    return new Date(dateInput).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}
</script>

<template>
    <v-card elevation="0">
        <v-card-item class="pb-2">
            <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                <div>
                    <v-card-title class="text-h5">Procedure Schedule</v-card-title>
                    <v-card-subtitle>View procedures as a calendar or table</v-card-subtitle>
                </div>

                <v-tabs v-model="viewTab" color="primary" density="comfortable">
                    <v-tab value="calendar">Calendar</v-tab>
                    <v-tab value="list">List</v-tab>
                </v-tabs>
            </div>
        </v-card-item>

        <v-divider />

        <v-window v-model="viewTab">
            <v-window-item value="calendar">
                <v-card-text class="calendar-shell d-flex flex-column ga-4">
                    <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                        <v-btn-toggle v-model="calendarView" color="primary" variant="outlined" divided density="comfortable">
                            <v-btn value="dayGridMonth">Month</v-btn>
                            <v-btn value="timeGridWeek">Week</v-btn>
                            <v-btn value="timeGridDay">Day</v-btn>
                        </v-btn-toggle>

                        <div class="text-caption text-medium-emphasis">
                            Click any day or procedure to see the day list
                        </div>
                    </div>

                    <FullCalendar ref="calendarRef" :options="calendarOptions">
                        <template #eventContent="arg">
                            <div class="calendar-event">
                                <div class="calendar-event-title">
                                    {{ arg.event.extendedProps.patientName }}
                                </div>
                                <div class="calendar-event-subtitle">
                                    {{ arg.event.extendedProps.procedure }}
                                </div>
                            </div>
                        </template>
                    </FullCalendar>
                </v-card-text>
            </v-window-item>

            <v-window-item value="list">
                <v-card-text class="d-flex flex-column ga-4">
                    <v-table hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Patient</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Procedure</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Schedule</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Priority</th>
                                <th class="text-left text-caption font-weight-bold text-uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in paginatedProcedures" :key="item.id">
                                <td class="py-3">
                                    <div class="text-body-2 font-weight-medium">{{ item.patientName }}</div>
                                </td>
                                <td class="py-3">{{ item.procedure }}</td>
                                <td class="py-3 text-body-2 text-medium-emphasis">{{ formatListDate(item.scheduledAt) }}</td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" :color="item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'success'">
                                        {{ item.priority }}
                                    </v-chip>
                                </td>
                                <td class="py-3">
                                    <v-chip size="small" variant="tonal" color="primary">
                                        {{ item.status }}
                                    </v-chip>
                                </td>
                            </tr>
                            <tr v-if="procedures.length === 0">
                                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                    No procedures scheduled yet
                                </td>
                            </tr>
                        </tbody>
                    </v-table>

                    <div v-if="procedures.length > itemsPerPage" class="d-flex justify-end">
                        <v-pagination v-model="currentPage" :length="totalPages" rounded="circle" />
                    </div>
                </v-card-text>
            </v-window-item>
        </v-window>
    </v-card>

    <v-dialog v-model="dateDialog" max-width="720">
        <v-card>
            <v-card-title class="text-h6">
                Procedures on {{ selectedDateLabel }}
            </v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
                <v-card
                    v-for="procedure in selectedProcedures"
                    :key="procedure.id"
                    variant="outlined"
                    rounded="lg"
                    class="procedure-day-card"
                >
                    <v-card-text class="pa-4">
                        <div class="d-flex align-start justify-space-between ga-4">
                            <div>
                                <div class="text-body-1 font-weight-semibold">{{ procedure.patientName }}</div>
                                <div class="text-caption text-medium-emphasis">{{ procedure.procedure }}</div>
                            </div>
                            <v-chip size="small" variant="tonal" color="primary">
                                {{ procedure.status }}
                            </v-chip>
                        </div>

                        <div class="d-flex flex-wrap ga-2 mt-3">
                            <v-chip size="x-small" variant="tonal" :color="procedure.priority === 'High' ? 'error' : procedure.priority === 'Medium' ? 'warning' : 'success'">
                                {{ procedure.priority }}
                            </v-chip>
                            <div class="text-caption text-medium-emphasis">
                                {{ formatDialogTime(procedure.scheduledAt) }}
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div v-if="selectedProcedures.length === 0" class="text-center py-6 text-medium-emphasis">
                    No procedures on this day
                </div>
            </v-card-text>
            <v-card-actions class="justify-end">
                <v-btn variant="text" @click="dateDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
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
    margin-bottom: 1rem;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.calendar-shell :deep(.fc .fc-toolbar-title) {
    font-size: 1.15rem;
    font-weight: 600;
}

.calendar-shell :deep(.fc .fc-button) {
    border-radius: 10px;
    box-shadow: none;
}

.calendar-shell :deep(.fc .fc-daygrid-event),
.calendar-shell :deep(.fc .fc-timegrid-event) {
    border-radius: 8px;
    padding: 2px 4px;
    cursor: pointer;
}

.calendar-shell :deep(.fc .fc-daygrid-day-frame),
.calendar-shell :deep(.fc .fc-timegrid-slot),
.calendar-shell :deep(.fc .fc-col-header-cell-cushion) {
    cursor: pointer;
}

.calendar-event {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
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

.procedure-day-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}
</style>
