<script setup lang="ts">
import { computed, ref } from 'vue'
import OpeningHoursModal, { type OpeningHour } from './OpeningHoursModal.vue'
import HolidayModal, { type Holiday } from './HolidayModal.vue'

const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
]

const config = ref<{
    enabled: boolean
    token: string | null
    opening_hours: OpeningHour[]
    holidays: Holiday[]
}>({
    enabled: false,
    token: null,
    opening_hours: [],
    holidays: [],
})

const loading = ref(false)
const savingToggle = ref(false)
const saving = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

function notify(msg: string, color = 'success') {
    snackbarMsg.value = msg
    snackbarColor.value = color
    snackbar.value = true
}

async function loadConfig() {
    loading.value = true
    try {
        const data = await $fetch('/api/public-booking')
        config.value = {
            enabled: data.enabled ?? false,
            token: data.token ?? null,
            opening_hours: data.opening_hours ?? [],
            holidays: data.holidays ?? [],
        }
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to load public booking configuration', 'error')
    } finally {
        loading.value = false
    }
}

onMounted(loadConfig)

const publicUrl = computed(() => {
    if (!config.value.token) return ''
    const origin = import.meta.client ? window.location.origin : ''
    return `${origin}/public-booking/${config.value.token}`
})

async function toggleEnabled(value: boolean) {
    savingToggle.value = true
    try {
        const data = await $fetch('/api/public-booking', {
            method: 'PUT',
            body: { enabled: value },
        })
        config.value.enabled = data.enabled ?? value
        config.value.token = data.token ?? config.value.token
        notify(value ? 'Public booking enabled' : 'Public booking disabled')
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to update public booking status', 'error')
    } finally {
        savingToggle.value = false
    }
}

async function copyUrl() {
    try {
        await navigator.clipboard.writeText(publicUrl.value)
        notify('Public booking URL copied to clipboard')
    } catch {
        notify('Failed to copy URL', 'error')
    }
}

function getDayName(day: number) {
    return DAY_NAMES[day] ?? '-'
}

function formatTime(timeStr?: string) {
    if (!timeStr) return '-'
    const parts = timeStr.split(':')
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (Number.isNaN(h) || Number.isNaN(m)) return '-'
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
}

// ---- Opening hours modal ----
const hoursDialog = ref(false)
const hoursMode = ref<'add' | 'edit' | 'delete'>('add')
const selectedHour = ref<OpeningHour | null>(null)

function openHoursAdd() {
    hoursMode.value = 'add'
    selectedHour.value = null
    hoursDialog.value = true
}

function openHoursEdit(hour: OpeningHour) {
    hoursMode.value = 'edit'
    selectedHour.value = hour
    hoursDialog.value = true
}

function openHoursDelete(hour: OpeningHour) {
    hoursMode.value = 'delete'
    selectedHour.value = hour
    hoursDialog.value = true
}

function closeHoursDialog() {
    hoursDialog.value = false
    selectedHour.value = null
}

async function submitHours(payload: any) {
    saving.value = true
    try {
        let next: OpeningHour[] = [...config.value.opening_hours]
        if (hoursMode.value === 'delete') {
            next = next.filter(h => h.id !== payload.id)
        } else if (hoursMode.value === 'edit') {
            next = next.map(h => h.id === payload.id ? { ...h, ...payload } : h)
        } else {
            next.push(payload)
        }
        const data = await $fetch('/api/public-booking', {
            method: 'PUT',
            body: { opening_hours: next },
        })
        config.value.opening_hours = data.opening_hours ?? next
        notify('Opening hours saved successfully')
        closeHoursDialog()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to save opening hours', 'error')
    } finally {
        saving.value = false
    }
}

// ---- Holiday modal ----
const holidayDialog = ref(false)
const holidayMode = ref<'add' | 'delete'>('add')
const selectedHoliday = ref<Holiday | null>(null)

function openHolidayAdd() {
    holidayMode.value = 'add'
    selectedHoliday.value = null
    holidayDialog.value = true
}

function openHolidayDelete(holiday: Holiday) {
    holidayMode.value = 'delete'
    selectedHoliday.value = holiday
    holidayDialog.value = true
}

function closeHolidayDialog() {
    holidayDialog.value = false
    selectedHoliday.value = null
}

async function submitHoliday(payload: any) {
    saving.value = true
    try {
        let next: Holiday[] = [...config.value.holidays]
        if (holidayMode.value === 'delete') {
            next = next.filter(h => h.id !== payload.id)
        } else {
            next.push(payload)
        }
        const data = await $fetch('/api/public-booking', {
            method: 'PUT',
            body: { holidays: next },
        })
        config.value.holidays = data.holidays ?? next
        notify('Holiday saved successfully')
        closeHolidayDialog()
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to save holiday', 'error')
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div>
        <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="mb-5">
            <v-card elevation="0">
                <v-card-text>
                    <div class="d-flex align-center ga-2">
                        <v-icon icon="mdi-calendar-star" size="24" color="primary" />
                        <div class="text-h5 font-weight-bold">Public Appointment</div>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                        Allow patients to book appointments online without logging in.
                    </div>
                </v-card-text>
            </v-card>
        </v-card>

        <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="bg-surface mb-5">
            <v-card-text>
                <div class="d-flex align-center justify-space-between ga-4 flex-wrap">
                    <div>
                        <div class="text-h6 font-weight-bold">Public Booking</div>
                        <div class="text-body-2 text-medium-emphasis mt-1">
                            When enabled, a public booking page will be available for anyone with the link.
                        </div>
                    </div>
                    <v-switch v-model="config.enabled" color="success" hide-details :loading="savingToggle"
                        @update:model-value="toggleEnabled" />
                </div>

                <v-divider class="my-4" />

                <template v-if="config.enabled && config.token">
                    <v-label class="text-caption font-weight-medium mb-2 d-block">Public booking URL</v-label>
                    <div class="d-flex align-center ga-2 flex-wrap">
                        <v-text-field :model-value="publicUrl" readonly variant="outlined" density="compact"
                            hide-details style="max-width: 520px;" class="flex-grow-1" />
                        <v-btn variant="tonal" color="primary" prepend-icon="mdi-content-copy" @click="copyUrl">
                            Copy
                        </v-btn>
                        <v-btn variant="tonal" color="secondary" prepend-icon="mdi-open-in-new" :href="publicUrl"
                            target="_blank" rel="noopener">
                            Open
                        </v-btn>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-2">
                        Share this link with your patients to let them book appointments online.
                    </div>
                </template>
            </v-card-text>
        </v-card>

        <v-row>
            <v-col cols="12" xl="7">
                <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="bg-surface h-100">
                    <v-card-item class="pb-2">
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <v-card-title class="text-h6 font-weight-bold">Booking Open</v-card-title>
                                <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
                                    Operating hours when patients can book appointments.
                                </v-card-subtitle>
                            </div>
                            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" density="comfortable"
                                @click="openHoursAdd">
                                Add Hours
                            </v-btn>
                        </div>
                    </v-card-item>

                    <v-divider />

                    <v-table class="bordered-table" hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Day</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Start
                                </th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">End</th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status
                                </th>
                                <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="5" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary" />
                                </td>
                            </tr>
                            <tr v-else-if="config.opening_hours.length === 0">
                                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-calendar-clock" size="32" class="mb-2 d-block mx-auto" />
                                    No opening hours configured
                                </td>
                            </tr>
                            <tr v-else v-for="hour in config.opening_hours" :key="hour.id">
                                <td class="py-3 text-body-2 font-weight-medium">{{ getDayName(hour.day_of_week) }}</td>
                                <td class="py-3 text-body-2">{{ formatTime(hour.start_time) }}</td>
                                <td class="py-3 text-body-2">{{ formatTime(hour.end_time) }}</td>
                                <td class="py-3">
                                    <v-chip :color="hour.is_active ? 'success' : 'default'" variant="tonal"
                                        size="small">
                                        {{ hour.is_active ? 'Active' : 'Inactive' }}
                                    </v-chip>
                                </td>
                                <td class="py-3 text-right">
                                    <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="secondary"
                                        density="comfortable" @click="openHoursEdit(hour)" />
                                    <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                                        density="comfortable" @click="openHoursDelete(hour)" />
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>

            <v-col cols="12" xl="5">
                <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="bg-surface">
                    <v-card-item class="pb-2">
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <v-card-title class="text-h6 font-weight-bold">Holidays</v-card-title>
                                <v-card-subtitle class="text-caption text-medium-emphasis mt-1">
                                    Dates when the clinic is closed.
                                </v-card-subtitle>
                            </div>
                            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" density="comfortable"
                                @click="openHolidayAdd">
                                Add Holiday
                            </v-btn>
                        </div>
                    </v-card-item>

                    <v-divider />

                    <v-table class="bordered-table" hover density="comfortable">
                        <thead class="bg-containerBg">
                            <tr>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Date
                                </th>
                                <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Name
                                </th>
                                <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="3" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary" />
                                </td>
                            </tr>
                            <tr v-else-if="config.holidays.length === 0">
                                <td colspan="3" class="text-center py-8 text-medium-emphasis">
                                    <v-icon icon="mdi-calendar-star" size="32" class="mb-2 d-block mx-auto" />
                                    No holidays configured
                                </td>
                            </tr>
                            <tr v-else v-for="holiday in config.holidays" :key="holiday.id">
                                <td class="py-3 text-body-2 font-weight-medium">{{ formatDate(holiday.holiday_date) }}
                                </td>
                                <td class="py-3 text-body-2">{{ holiday.name || '-' }}</td>
                                <td class="py-3 text-right">
                                    <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error"
                                        density="comfortable" @click="openHolidayDelete(holiday)" />
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog v-model="hoursDialog" max-width="480">
            <OpeningHoursModal :loading="saving" :mode="hoursMode" :hour="selectedHour" :hours="config.opening_hours"
                @submit="submitHours" @cancel="closeHoursDialog" />
        </v-dialog>

        <v-dialog v-model="holidayDialog" max-width="440">
            <HolidayModal :loading="saving" :mode="holidayMode" :holiday="selectedHoliday" @submit="submitHoliday"
                @cancel="closeHolidayDialog" />
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" :timeout="3000">
            {{ snackbarMsg }}
            <template #actions>
                <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
            </template>
        </v-snackbar>
    </div>
</template>
