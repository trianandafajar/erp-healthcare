<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

type CallBooking = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  booking_date: string
  booking_time: string
  status: string
  created_at: string
}

const props = defineProps<{
  bookings: CallBooking[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const calendarRef = ref<any>(null)
const calendarTitle = ref('')
const selectedDate = ref<string | null>(null)
const selectedDateBookings = computed(() => {
  if (!selectedDate.value) return []
  return props.bookings.filter((b) => b.booking_date === selectedDate.value)
})
const detailDialog = ref(false)

const calendarEvents = computed(() =>
  props.bookings.map((b) => ({
    id: b.id,
    title: `${b.name} — ${formatTime(b.booking_time)}`,
    start: `${b.booking_date}T${b.booking_time}`,
    allDay: true,
    backgroundColor: 'rgb(var(--v-theme-primary))',
    borderColor: 'rgb(var(--v-theme-primary))',
    textColor: '#fff',
    extendedProps: { name: b.name, time: b.booking_time, status: b.status },
  }))
)

function handleDateClick(info: { dateStr: string }) {
  selectedDate.value = info.dateStr
  detailDialog.value = true
}

function handleEventClick(info: { event: { start: Date | null } }) {
  if (info.event.start) {
    const d = info.event.start
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    selectedDate.value = `${d.getFullYear()}-${mm}-${dd}`
    detailDialog.value = true
  }
}

function handleDatesSet(info: { view: { title: string } }) {
  calendarTitle.value = info.view.title
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: false as false,
  height: 'auto',
  firstDay: 1,
  events: calendarEvents.value,
  dayMaxEvents: 3,
  eventDisplay: 'block',
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  datesSet: handleDatesSet,
}))

function statusColor(status: string) {
  if (status === 'confirmed') return 'success'
  if (status === 'completed') return 'info'
  if (status === 'cancelled') return 'error'
  return 'warning'
}

function formatTime(t: string) {
  const parts = t.split(':')
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
}
</script>

<template>
  <v-card elevation="0">
    <v-card-text>
      <div class="text-h5 font-weight-bold">Call Bookings</div>
      <div class="text-caption text-medium-emphasis">Manage demo call requests from the landing page.</div>
    </v-card-text>
  </v-card>

  <v-card elevation="0" class="mt-4">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
        <div class="d-flex align-center gap-2">
          <v-btn icon="mdi-chevron-left" variant="tonal" color="primary" density="comfortable"
            @click="calendarRef?.getApi?.().prev()" />
          <v-btn icon="mdi-chevron-right" variant="tonal" color="primary" density="comfortable"
            @click="calendarRef?.getApi?.().next()" />
          <v-btn variant="outlined" color="secondary" density="comfortable" @click="calendarRef?.getApi?.().today()">
            Today
          </v-btn>
        </div>
        <span class="text-h6 font-weight-bold">{{ calendarTitle }}</span>
        <v-btn color="primary" variant="tonal" density="comfortable" prepend-icon="mdi-refresh"
          @click="emit('refresh')">
          Refresh
        </v-btn>
      </div>

      <div class="superadmin-calendar-shell">
        <FullCalendar ref="calendarRef" :options="calendarOptions">
          <template #eventContent="arg">
            <div class="cal-event">
              <span class="cal-event-title">{{ arg.event.extendedProps.name }}</span>
            </div>
          </template>
        </FullCalendar>
      </div>
    </v-card-text>
  </v-card>

  <v-dialog v-model="detailDialog" max-width="600">
    <v-card v-if="selectedDate">
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="text-h6">{{ formatDate(selectedDate) }}</span>
        <v-chip :color="selectedDateBookings.length === 0 ? 'default' : 'primary'" size="small">
          {{ selectedDateBookings.length }} booking{{ selectedDateBookings.length !== 1 ? 's' : '' }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-list v-if="selectedDateBookings.length > 0" lines="three">
          <v-list-item v-for="booking in selectedDateBookings" :key="booking.id" :title="booking.name"
            :subtitle="booking.email">
            <template #prepend>
              <v-avatar color="primary" size="40">
                <span class="text-white font-weight-bold text-uppercase">{{ booking.name.charAt(0) }}</span>
              </v-avatar>
            </template>
            <template #append>
              <v-chip :color="statusColor(booking.status)" size="x-small" variant="tonal">
                {{ booking.status }}
              </v-chip>
            </template>
            <template #default>
              <div class="text-caption text-medium-emphasis mt-1">
                <div>{{ formatTime(booking.booking_time) }}{{ booking.phone ? ` &middot; ${booking.phone}` : '' }}</div>
                <div v-if="booking.message" class="mt-1">{{ booking.message }}</div>
              </div>
            </template>
          </v-list-item>
        </v-list>
        <div v-else class="text-center py-8 text-medium-emphasis">
          No bookings for this date.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.superadmin-calendar-shell :deep(.fc) {
  --fc-border-color: rgba(0, 0, 0, 0.12);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-today-bg-color: rgba(var(--v-theme-primary), 0.06);
  font-size: 0.9rem;
}

.superadmin-calendar-shell :deep(.fc .fc-toolbar) {
  display: none;
}

.superadmin-calendar-shell :deep(.fc .fc-daygrid-day-frame) {
  cursor: pointer;
  min-height: 80px;
}

.superadmin-calendar-shell :deep(.fc .fc-col-header-cell-cushion) {
  padding: 10px 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.superadmin-calendar-shell :deep(.fc .fc-daygrid-day-number) {
  padding: 4px 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.superadmin-calendar-shell :deep(.fc .fc-daygrid-event) {
  border-radius: 6px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
}

.cal-event {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cal-event-title {
  font-size: 0.72rem;
  line-height: 1.3;
}

.superadmin-calendar-shell :deep(.fc .fc-day-today .fc-day-cell-number) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>
