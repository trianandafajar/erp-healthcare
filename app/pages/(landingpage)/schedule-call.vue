<template>
  <div class="schedule-page">
    <Header />
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900">Schedule a Call</h1>
          <p class="mt-3 text-gray-500 leading-relaxed">Pick a date and time that works best for you. We'll get back to
            you shortly.</p>
        </div>

        <div v-if="submitted" class="max-w-lg mx-auto text-center py-16">
          <div class="text-5xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900">You're All Set!</h2>
          <p class="mt-3 text-gray-500">We've received your booking request for <strong>{{ formattedBooking }}</strong>.
            Our team will confirm via email shortly.</p>
          <NuxtLink to="/"
            class="mt-6 inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-[#176D37] rounded-full hover:bg-[#176D37]/90 transition-all">
            Back to Home
          </NuxtLink>
        </div>

        <div v-else class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div class="lg:col-span-3">
            <div class="bg-white rounded-2xl border border-gray-200 p-6">
              <div class="schedule-calendar-shell">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-900">Select a Date</h3>
                  <div class="flex items-center gap-2">
                    <button @click="calendarApi?.prev()"
                      class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button @click="calendarApi?.next()"
                      class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span class="text-sm font-semibold text-gray-700 w-32 text-center">{{ calendarTitle }}</span>
                  </div>
                </div>
                <FullCalendar ref="calendarRef" :options="calendarOptions" />
              </div>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div v-if="!selectedDate" class="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div class="text-gray-400 text-4xl mb-3">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p class="text-gray-500">Select a date from the calendar to see available time slots.</p>
            </div>

            <div v-else class="bg-white rounded-2xl border border-gray-200 p-6">
              <div class="mb-6">
                <div class="text-sm text-gray-500 uppercase tracking-wide font-medium">Selected Date</div>
                <div class="text-xl font-bold text-gray-900 mt-1">{{ formattedSelectedDate }}</div>
              </div>

              <div>
                <div class="text-sm text-gray-500 uppercase tracking-wide font-medium mb-3">Available Times</div>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="slot in timeSlots" :key="slot"
                    @click="selectedTime = slot"
                    :class="[
                      'px-4 py-2.5 text-sm font-medium rounded-lg border transition-all',
                      selectedTime === slot
                        ? 'bg-[#176D37] text-white border-[#176D37]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#176D37] hover:text-[#176D37]'
                    ]">
                    {{ slot }}
                  </button>
                </div>
              </div>

              <div v-if="selectedTime" class="mt-8 pt-6 border-t border-gray-100">
                <form @submit.prevent="submitBooking">
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input v-model="form.name" type="text" required
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-[#176D37] focus:ring-1 focus:ring-[#176D37] transition-colors"
                        placeholder="Your name" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input v-model="form.email" type="email" required
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-[#176D37] focus:ring-1 focus:ring-[#176D37] transition-colors"
                        placeholder="your@email.com" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input v-model="form.phone" type="tel"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-[#176D37] focus:ring-1 focus:ring-[#176D37] transition-colors"
                        placeholder="+62 xxx" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea v-model="form.message" rows="3"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-[#176D37] focus:ring-1 focus:ring-[#176D37] transition-colors"
                        placeholder="Tell us about your needs"></textarea>
                    </div>
                  </div>
                  <button type="submit" :disabled="submitting"
                    class="mt-6 w-full px-6 py-3 text-sm font-bold text-white bg-[#176D37] rounded-full hover:bg-[#176D37]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ submitting ? 'Submitting...' : 'Confirm Booking' }}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Header from '~/components/landingpage/Header.vue'
import Footer from '~/components/landingpage/Footer.vue'

definePageMeta({
  layout: 'blank',
})

const calendarRef = ref<any>(null)
const calendarTitle = ref('')
const selectedDate = ref<string | null>(null)
const selectedTime = ref<string | null>(null)
const submitting = ref(false)
const submitted = ref(false)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
})

const formattedBooking = computed(() => {
  if (!selectedDate.value || !selectedTime.value) return ''
  return `${formattedSelectedDate.value} at ${selectedTime.value}`
})

const calendarApi = computed(() => calendarRef.value?.getApi?.())

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 9; h <= 16; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 16) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

const timeSlots = computed(() => {
  const allSlots = generateTimeSlots()
  if (!selectedDate.value) return allSlots

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  if (selectedDate.value !== todayStr) return allSlots

  const currentMinutes = today.getHours() * 60 + today.getMinutes()
  return allSlots.filter((slot) => {
    const parts = slot.split(':')
    const h = Number(parts[0]) || 0
    const m = Number(parts[1]) || 0
    return h * 60 + m > currentMinutes + 30
  })
})

function handleDateClick(info: { dateStr: string; date: Date }) {
  const day = info.date.getDay()
  if (day === 0 || day === 6) return
  if (info.date < new Date(new Date().toDateString())) return

  selectedDate.value = info.dateStr
  selectedTime.value = null
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
  validRange: { start: new Date().toISOString().split('T')[0] },
  dateClick: handleDateClick,
  datesSet: handleDatesSet,
  dayCellClassNames: (arg: { date: Date; isPast: boolean }) => {
    const day = arg.date.getDay()
    if (day === 0 || day === 6) return 'fc-day-weekend'
    if (arg.isPast) return 'fc-day-past'
    return 'fc-day-available'
  },
}))

watch(selectedDate, () => {
  selectedTime.value = null
})

async function submitBooking() {
  if (!selectedDate.value || !selectedTime.value || !form.name || !form.email) return
  submitting.value = true

  try {
    await $fetch('/api/call-bookings', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        booking_date: selectedDate.value,
        booking_time: selectedTime.value,
      },
    })
    submitted.value = true
  } catch (e) {
    console.error('Booking failed:', e)
    alert('Failed to submit booking. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.schedule-calendar-shell :deep(.fc) {
  --fc-border-color: #e5e7eb;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  --fc-today-bg-color: rgba(23, 109, 55, 0.06);
  --fc-event-text-color: #fff;
  font-size: 0.9rem;
}

.schedule-calendar-shell :deep(.fc .fc-toolbar) {
  display: none;
}

.schedule-calendar-shell :deep(.fc .fc-daygrid-day-frame) {
  cursor: pointer;
  min-height: 70px;
}

.schedule-calendar-shell :deep(.fc .fc-daygrid-day-number) {
  padding: 6px 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.schedule-calendar-shell :deep(.fc .fc-col-header-cell-cushion) {
  padding: 10px 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.schedule-calendar-shell :deep(.fc .fc-day-today .fc-daygrid-day-number) {
  background: rgba(23, 109, 55, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #176D37;
  font-weight: 700;
}

.schedule-calendar-shell :deep(.fc-day-weekend) {
  opacity: 0.4;
  pointer-events: none;
}

.schedule-calendar-shell :deep(.fc-day-past) {
  opacity: 0.3;
  pointer-events: none;
}

.schedule-calendar-shell :deep(.fc .fc-daygrid-body-unbalanced .fc-daygrid-day-events) {
  min-height: 0;
}
</style>
