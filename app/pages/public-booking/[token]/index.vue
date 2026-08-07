<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import { getContrastText, isValidHex } from '@/utils/color'

definePageMeta({
    skipTenantCheck: true,
    layout: 'blank',
})

const route = useRoute()
const token = route.params.token as string

const theme = useTheme()

interface OpeningHour {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

interface Holiday {
    id: string
    holiday_date: string
    name: string | null
}

interface Doctor {
    id: string
    full_name: string
    specialization: string | null
    department_id: string | null
    department_name: string | null
    photo_url: string | null
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
]

const config = ref<{
    tenant: {
        id: string
        name: string
        brand_color: string
        display_name: string
        logo_url: string | null
    }
    opening_hours: OpeningHour[]
    holidays: Holiday[]
    doctors: Doctor[]
} | null>(null)

const pending = ref(true)
const errorMsg = ref('')

async function loadConfig() {
    pending.value = true
    try {
        const data = await $fetch(`/api/public-booking/${token}`)
        config.value = data
        if (isValidHex(data.tenant?.brand_color)) {
            theme.themes.value.light.colors.primary = data.tenant.brand_color
            theme.themes.value.light.colors['on-primary'] = getContrastText(data.tenant.brand_color)
        }
    } catch (e: any) {
        errorMsg.value = e?.data?.statusMessage ?? e?.data?.message ?? 'Booking page not found'
    } finally {
        pending.value = false
    }
}

onMounted(loadConfig)

const brandColor = computed(() => config.value?.tenant?.brand_color ?? '#176D37')

function holidayFor(d: Date): Holiday | null {
    const key = toDateKey(d)
    return (config.value?.holidays ?? []).find(h => h.holiday_date === key) ?? null
}

function isHoliday(d: Date): boolean {
    return holidayFor(d) !== null
}

type DateStatus = 'past' | 'holiday' | 'available'

function dateStatus(d: Date | null): DateStatus {
    if (!(d instanceof Date)) return 'available'
    if (isHoliday(d)) return 'holiday'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return 'past'
    return 'available'
}

function dateAvailable(d: Date | null): boolean {
    return dateStatus(d) === 'available'
}

function cellButtonStyle(d: Date | null): Record<string, string> {
    if (!(d instanceof Date)) return {}
    if (selectedDate && toDateKey(d) === toDateKey(selectedDate)) {
        return { backgroundColor: brandColor.value, color: '#ffffff' }
    }
    const status = dateStatus(d)
    if (status === 'available') return { backgroundColor: brandColor.value + '47', color: '#111827' }
    if (status === 'holiday') return { backgroundColor: '#fee2e2', color: '#dc2626' }
    if (status === 'past') return { backgroundColor: '#f3f4f6', color: '#d1d5db' }
    return {}
}

function dateTooltip(d: Date | null): string | undefined {
    if (!(d instanceof Date)) return undefined
    const status = dateStatus(d)
    if (status === 'holiday') {
        const h = holidayFor(d)
        return h?.name ? `Holiday: ${h.name}` : 'Holiday'
    }
    if (status === 'past') return 'Past date'
    return undefined
}

function toDateKey(d: Date | null): string {
    if (!(d instanceof Date)) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

// ---- Calendar ----
const calendarMonth = ref(new Date())

const calendarCells = computed(() => {
    const year = calendarMonth.value.getFullYear()
    const month = calendarMonth.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const leadingBlanks = firstDay.getDay()
    const cells: (Date | null)[] = []
    for (let i = 0; i < leadingBlanks; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
})

const calendarTitle = computed(() =>
    calendarMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

function prevMonth() {
    calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
    calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + 1, 1)
}

function isToday(d: Date) {
    return toDateKey(d) === toDateKey(new Date())
}

const selectedDate = ref<Date | null>(null)

const availableDoctorIds = ref<Set<string>>(new Set())
const doctorSlots = ref<Record<string, string[]>>({})
const dateDoctorsLoading = ref(false)

async function fetchDoctorsForDate(d: Date): Promise<{ ids: Set<string>; slotsMap: Record<string, string[]> }> {
    const res = await $fetch<{ doctors: { id: string; slots: string[] }[] }>(
        `/api/public-booking/${token}/doctors`,
        { query: { date: toDateKey(d) } }
    )
    const ids = new Set<string>()
    const slotsMap: Record<string, string[]> = {}
    for (const doc of res.doctors ?? []) {
        ids.add(doc.id)
        slotsMap[doc.id] = doc.slots ?? []
    }
    return { ids, slotsMap }
}

async function loadDoctorsForDate(d: Date) {
    dateDoctorsLoading.value = true
    try {
        const { ids, slotsMap } = await fetchDoctorsForDate(d)
        availableDoctorIds.value = ids
        doctorSlots.value = slotsMap
    } catch {
        availableDoctorIds.value = new Set()
        doctorSlots.value = {}
    } finally {
        dateDoctorsLoading.value = false
    }
}

function selectDate(d: Date) {
    if (!dateAvailable(d)) return
    selectedDate.value = d
    selectedDoctor.value = null
    selectedSlot.value = null
    loadDoctorsForDate(d)
}

const selectedDateLabel = computed(() => {
    if (!selectedDate.value) return ''
    return selectedDate.value.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
})

// ---- Doctors ----
const selectedDoctor = ref<string | null>(null)
const specializationFilter = ref<string>('')

const specializations = computed(() => {
    const set = new Set<string>()
    for (const d of config.value?.doctors ?? []) {
        if (d.specialization) set.add(d.specialization)
    }
    return [...set].sort()
})

const filteredDoctors = computed(() => {
    let doctors = config.value?.doctors ?? []
    if (specializationFilter.value) {
        doctors = doctors.filter(d => d.specialization === specializationFilter.value)
    }
    if (selectedDate.value) {
        doctors = doctors.filter(d => availableDoctorIds.value.has(d.id))
    }
    return doctors
})

function selectDoctor(id: string) {
    selectedDoctor.value = selectedDoctor.value === id ? null : id
    selectedSlot.value = null
    slots.value = selectedDoctor.value ? (doctorSlots.value[selectedDoctor.value] ?? []) : []
}

const selectedDoctorObj = computed(() =>
    (config.value?.doctors ?? []).find(d => d.id === selectedDoctor.value) ?? null
)

// ---- Slots ----
const slots = ref<string[]>([])
const selectedSlot = ref<string | null>(null)

// ---- Form ----
const form = ref({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    chief_complaint: '',
})

const submitting = ref(false)
const booked = ref(false)
const bookedSummary = ref<{ date: string; time: string; doctor: string } | null>(null)
const formError = ref('')

async function submitBooking() {
    formError.value = ''
    if (!selectedDoctor.value || !selectedDate.value || !selectedSlot.value) return
    if (!form.value.full_name.trim() || !form.value.email.trim()) {
        formError.value = 'Name and email are required.'
        return
    }

    submitting.value = true
    try {
        // Re-fetch slots so an already-booked time is detected before submitting
        const { ids, slotsMap } = await fetchDoctorsForDate(selectedDate.value)
        availableDoctorIds.value = ids
        doctorSlots.value = slotsMap
        const freshSlots = slotsMap[selectedDoctor.value] ?? []
        if (selectedDoctor.value && !freshSlots.includes(selectedSlot.value)) {
            slots.value = freshSlots
            selectedSlot.value = null
            if (freshSlots.length) {
                formError.value = 'That time has just been booked. Please select another time.'
            } else {
                formError.value = 'This doctor has no remaining slots for this date.'
            }
            return
        }

        const res = await $fetch(`/api/public-booking/${token}`, {
            method: 'POST',
            body: {
                doctor_id: selectedDoctor.value,
                appointment_date: toDateKey(selectedDate.value),
                appointment_time: selectedSlot.value,
                chief_complaint: form.value.chief_complaint.trim() || null,
                patient: {
                    full_name: form.value.full_name.trim(),
                    email: form.value.email.trim(),
                    phone: form.value.phone.trim() || null,
                    date_of_birth: form.value.date_of_birth || null,
                    gender: form.value.gender || null,
                },
            },
        })
        const doctor = (config.value?.doctors ?? []).find(d => d.id === selectedDoctor.value)
        bookedSummary.value = {
            date: toDateKey(selectedDate.value),
            time: selectedSlot.value,
            doctor: doctor?.full_name ?? 'Doctor',
        }
        booked.value = true
        loadDoctorsForDate(selectedDate.value)
    } catch (e: any) {
        formError.value = e?.data?.message ?? 'Failed to create booking. Please try again.'
    } finally {
        submitting.value = false
    }
}

function reset() {
    selectedDate.value = null
    selectedDoctor.value = null
    specializationFilter.value = ''
    selectedSlot.value = null
    slots.value = []
    availableDoctorIds.value = new Set()
    doctorSlots.value = {}
    form.value = { full_name: '', email: '', phone: '', date_of_birth: '', gender: '', chief_complaint: '' }
    booked.value = false
    bookedSummary.value = null
}

function formatTime(t: string) {
    const parts = t.split(':')
    const h = Number(parts[0])
    const m = Number(parts[1])
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function getOpeningLabel(day: number) {
    const h = (config.value?.opening_hours ?? []).find(x => x.day_of_week === day && x.is_active)
    if (!h) return null
    return `${DAY_NAMES_FULL[day]}: ${formatTime(h.start_time.slice(0, 5))} – ${formatTime(h.end_time.slice(0, 5))}`
}

const openingLabels = computed(() => {
    const labels: string[] = []
    for (let i = 0; i < 7; i++) {
        const label = getOpeningLabel(i)
        if (label) labels.push(label)
    }
    return labels
})
</script>

<template>
    <div class="flex min-h-screen flex-col" :style="{ backgroundColor: '#f6f8f7' }">
        <header class="border-b bg-white">
            <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
                <div class="flex items-center gap-3 min-w-0">
                    <img v-if="config?.tenant.logo_url" :src="config.tenant.logo_url" :alt="config.tenant.name"
                        class="h-10 w-10 rounded-lg object-cover" />
                    <div class="min-w-0">
                        <div class="truncate text-base font-bold text-gray-900">
                            {{ config?.tenant.display_name || config?.tenant.name || 'Healthcare' }}
                        </div>
                        <div class="text-xs text-gray-500">Online Booking</div>
                    </div>
                </div>
                <div v-if="openingLabels.length" class="hidden text-right md:block">
                    <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Opening Hours</div>
                    <div class="mt-0.5 text-xs text-gray-600">{{ openingLabels.join(' • ') }}</div>
                </div>
            </div>
        </header>

        <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            <!-- Loading -->
            <div v-if="pending" class="flex justify-center py-24">
                <v-progress-circular indeterminate :color="brandColor" />
            </div>

            <div v-else-if="errorMsg" class="rounded-2xl border bg-white px-6 py-16 text-center">
                <v-icon icon="mdi-calendar-remove" size="48" color="error" class="mb-3" />
                <h2 class="text-xl font-bold text-gray-900">Booking Unavailable</h2>
                <p class="mt-2 text-sm text-gray-500">{{ errorMsg }}</p>
            </div>

            <div v-else-if="booked" class="mx-auto max-w-lg rounded-2xl border bg-white px-6 py-14 text-center">
                <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                    :style="{ backgroundColor: brandColor + '1a' }">
                    <v-icon icon="mdi-check-circle-outline" size="36" :color="brandColor" />
                </div>
                <h2 class="text-2xl font-bold text-gray-900">Booking Confirmed</h2>
                <p class="mt-3 text-sm text-gray-500">
                    Your appointment has been scheduled with <strong>{{ bookedSummary?.doctor }}</strong>
                    on <strong>{{ bookedSummary?.date }}</strong> at
                    <strong>{{ formatTime(bookedSummary?.time || '') }}</strong>.
                </p>
                <p class="mt-2 text-xs text-gray-400">
                    Please arrive on time. Our team will contact you to confirm.
                </p>
                <button type="button" @click="reset"
                    class="mt-8 inline-flex items-center rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    :style="{ backgroundColor: brandColor }">
                    Make Another Booking
                </button>
            </div>

            <div v-else class="grid gap-6 lg:grid-cols-5">
                <section class="rounded-2xl border bg-white p-5 lg:col-span-2">
                    <div class="mb-4">
                        <div class="flex items-center justify-between">
                            <div class="text-sm font-semibold text-gray-500">Step 1</div>
                            <h2 class="text-base font-bold text-gray-900">Select Date</h2>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Pick a day we're open.</p>
                    </div>

                    <div class="mb-3 flex items-center justify-between">
                        <button type="button" @click="prevMonth"
                            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
                            <v-icon icon="mdi-chevron-left" size="20" />
                        </button>
                        <span class="text-sm font-semibold text-gray-700">{{ calendarTitle }}</span>
                        <button type="button" @click="nextMonth"
                            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
                            <v-icon icon="mdi-chevron-right" size="20" />
                        </button>
                    </div>

                    <div class="grid grid-cols-7 gap-1 text-center">
                        <div v-for="(d, i) in DAY_NAMES" :key="'h-' + i"
                            class="py-1 text-[11px] font-semibold uppercase text-gray-400">
                            {{ d }}
                        </div>
                    </div>

                    <div class="grid grid-cols-7 gap-1 text-center">
                        <div v-for="(cell, i) in calendarCells" :key="'c-' + i" class="aspect-square">
                            <span v-if="cell" class="block h-full w-full"
                                :title="dateTooltip(cell)">
                                <button type="button" :disabled="!dateAvailable(cell)" @click="selectDate(cell)"
                                    :class="[
                                        'flex h-full w-full items-center justify-center rounded-lg text-sm font-medium transition-all',
                                        dateStatus(cell) === 'available' ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed',
                                        selectedDate && toDateKey(cell) === toDateKey(selectedDate) ? 'shadow-sm' : '',
                                    ]"
                                    :style="cellButtonStyle(cell)">
                                    <span :class="isToday(cell) ? 'font-extrabold underline' : ''">{{
                                        cell.getDate() }}</span>
                                </button>
                            </span>
                            <div v-else></div>
                        </div>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2 text-[11px] text-gray-500">
                        <span class="inline-flex items-center gap-1">
                            <span class="h-3 w-3 rounded" :style="{ backgroundColor: brandColor }"></span>
                            Available
                        </span>
                        <span class="inline-flex items-center gap-1">
                            <span class="h-3 w-3 rounded" style="background-color: #fee2e2;"></span>
                            Holiday
                        </span>
                        <span class="inline-flex items-center gap-1">
                            <span class="h-3 w-3 rounded" style="background-color: #e5e7eb;"></span>
                            Past
                        </span>
                    </div>
                </section>

                <section class="space-y-6 lg:col-span-3">
                    <!-- Step 2: Doctors -->
                    <div class="rounded-2xl border bg-white p-5">
                        <div class="mb-4 flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <div class="text-sm font-semibold text-gray-500">Step 2</div>
                                <h2 class="text-base font-bold text-gray-900">Select Doctor</h2>
                            </div>
                            <v-select v-if="specializations.length" v-model="specializationFilter"
                                :items="specializations" label="Specialization" variant="outlined" density="compact"
                                clearable hide-details style="max-width: 220px;" class="flex-grow-0"
                                @update:model-value="selectedDoctor = null" />
                        </div>

                        <div v-if="dateDoctorsLoading" class="py-8 text-center text-sm text-gray-400">
                            <v-progress-circular indeterminate size="28" :color="brandColor" />
                        </div>

                        <div v-else-if="config && filteredDoctors.length === 0"
                            class="py-8 text-center text-sm text-gray-400">
                            <v-icon icon="mdi-doctor" size="36" class="mb-2 d-block mx-auto" />
                            {{ selectedDate ? 'No doctors available on this date.' : 'No doctors available for online booking.' }}
                        </div>

                        <div v-else class="space-y-3">
                            <button v-for="doc in filteredDoctors" :key="doc.id" type="button"
                                @click="selectDoctor(doc.id)" :class="[
                                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                                    selectedDoctor === doc.id
                                        ? 'border-transparent shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300',
                                ]"
                                :style="selectedDoctor === doc.id ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : {}">
                                <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                                    :style="{ backgroundColor: brandColor + '1a' }">
                                    <v-icon icon="mdi-doctor" size="22" :color="brandColor" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="truncate text-sm font-bold text-gray-900">{{ doc.full_name }}</div>
                                    <div class="truncate text-xs text-gray-500">
                                        {{ doc.specialization || 'General' }}
                                        <template v-if="doc.department_name"> • {{ doc.department_name }}</template>
                                    </div>
                                </div>
                                <v-icon :icon="selectedDoctor === doc.id ? 'mdi-check-circle' : 'mdi-chevron-right'"
                                    size="20" :color="selectedDoctor === doc.id ? brandColor : '#9ca3af'" />
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedDoctor" class="rounded-2xl border bg-white p-5">
                        <div class="mb-4">
                            <div class="text-sm font-semibold text-gray-500">Step 3</div>
                            <h2 class="text-base font-bold text-gray-900">Select Time</h2>
                            <p v-if="selectedDateLabel" class="mt-1 text-xs text-gray-500">{{ selectedDateLabel }}</p>
                        </div>

                        <div v-if="!selectedDate" class="py-6 text-center text-sm text-gray-400">
                            Please select a date first.
                        </div>
                        <div v-else-if="slots.length === 0" class="py-8 text-center text-sm text-gray-400">
                            No available time slots for this date.
                        </div>
                        <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            <button v-for="slot in slots" :key="slot" type="button" @click="selectedSlot = slot" :class="[
                                'rounded-lg border px-2 py-2.5 text-sm font-semibold transition-all',
                                selectedSlot === slot
                                    ? 'text-white shadow-sm'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-400',
                            ]"
                                :style="selectedSlot === slot ? { backgroundColor: brandColor, borderColor: brandColor } : {}">
                                {{ formatTime(slot) }}
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedDate && selectedDoctor && selectedSlot" class="rounded-2xl border bg-white p-5">
                        <div class="mb-4">
                            <div class="text-sm font-semibold text-gray-500">Step 4</div>
                            <h2 class="text-base font-bold text-gray-900">Your Details</h2>
                            <p class="mt-1 text-xs text-gray-500">
                                {{ selectedDoctorObj?.full_name }} • {{ selectedDateLabel }} at
                                {{ formatTime(selectedSlot) }}
                            </p>
                        </div>

                        <form @submit.prevent="submitBooking" class="space-y-4">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div class="sm:col-span-2">
                                    <label class="mb-1 block text-xs font-semibold text-gray-700">Full Name *</label>
                                    <input v-model="form.full_name" type="text" required
                                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none"
                                        placeholder="Your full name" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-semibold text-gray-700">Email *</label>
                                    <input v-model="form.email" type="email" required
                                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none"
                                        placeholder="you@email.com" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-semibold text-gray-700">Phone</label>
                                    <input v-model="form.phone" type="tel" inputmode="numeric"
                                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none"
                                        placeholder="08xxxxxxxxxx"
                                        @keydown="e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Delete' && e.key !== 'End' && e.key !== 'Home') e.preventDefault() }" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-semibold text-gray-700">Date of Birth</label>
                                    <input v-model="form.date_of_birth" type="date"
                                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-semibold text-gray-700">Gender</label>
                                    <select v-model="form.gender"
                                        class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none">
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="mb-1 block text-xs font-semibold text-gray-700">Chief
                                        Complaint</label>
                                    <textarea v-model="form.chief_complaint" rows="2"
                                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none"
                                        placeholder="Describe your symptoms (optional)"></textarea>
                                </div>
                            </div>

                            <p v-if="formError" class="text-xs font-semibold text-red-600">{{ formError }}</p>

                            <div class="flex items-center justify-between gap-3 pt-1">
                                <p class="text-xs text-gray-500">
                                    {{ selectedDateLabel }} at <strong>{{ formatTime(selectedSlot) }}</strong>
                                </p>
                                <button type="submit" :disabled="submitting"
                                    class="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    :style="{ backgroundColor: brandColor }">
                                    <v-icon v-if="submitting" icon="mdi-loading" size="18" class="animate-spin" />
                                    {{ submitting ? 'Booking...' : 'Confirm Booking' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </main>

        <footer class="border-t bg-white py-4">
            <div class="mx-auto max-w-5xl px-4 text-center text-xs text-gray-400">
                Powered by Healthcare • {{ config?.tenant.display_name || config?.tenant.name }}
            </div>
        </footer>
    </div>
</template>
