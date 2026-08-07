<script setup lang="ts">
import { ref, computed } from 'vue'

interface Holiday {
    id: string
    holiday_date: string
    name: string | null
}

interface OpeningHour {
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

const props = defineProps<{
    holidays: Holiday[]
    openingHours: OpeningHour[]
    selectedDate: Date | null
}>()

const emit = defineEmits<{
    (e: 'select', date: Date): void
    (e: 'next'): void
}>()

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const month = ref(new Date())

function toDateKey(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function holidayFor(d: Date): Holiday | null {
    const key = toDateKey(d)
    return props.holidays.find(h => h.holiday_date === key) ?? null
}

type DateStatus = 'past' | 'holiday' | 'available'

function isDayActive(d: Date): boolean {
    const dow = d.getDay()
    return (props.openingHours ?? []).some(h => h.day_of_week === dow && h.is_active)
}

function dateStatus(d: Date): DateStatus {
    if (holidayFor(d)) return 'holiday'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return 'past'
    if (!isDayActive(d)) return 'past'
    return 'available'
}

const cells = computed<(Date | null)[]>(() => {
    const year = month.value.getFullYear()
    const m = month.value.getMonth()
    const firstDay = new Date(year, m, 1)
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    const leadingBlanks = firstDay.getDay()
    const arr: (Date | null)[] = []
    for (let i = 0; i < leadingBlanks; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, m, d))
    return arr
})

const calendarTitle = computed(() =>
    month.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

const canGoPrev = computed(() => {
    const now = new Date()
    return month.value.getFullYear() > now.getFullYear() ||
        (month.value.getFullYear() === now.getFullYear() && month.value.getMonth() > now.getMonth())
})

function prevMonth() {
    if (!canGoPrev.value) return
    month.value = new Date(month.value.getFullYear(), month.value.getMonth() - 1, 1)
}

function nextMonth() {
    month.value = new Date(month.value.getFullYear(), month.value.getMonth() + 1, 1)
}

function isToday(d: Date): boolean {
    return toDateKey(d) === toDateKey(new Date())
}

function isSelected(d: Date): boolean {
    return props.selectedDate != null && toDateKey(props.selectedDate) === toDateKey(d)
}

function cellStyle(d: Date): Record<string, string> {
    if (isSelected(d)) {
        return { backgroundColor: 'rgb(var(--v-theme-primary))', color: '#fff' }
    }
    const status = dateStatus(d)
    if (status === 'available') {
        return { backgroundColor: 'rgba(var(--v-theme-primary), 0.15)', color: 'rgba(0,0,0,0.75)' }
    }
    if (status === 'holiday') {
        return { backgroundColor: 'rgba(var(--v-theme-error), 0.1)', color: 'rgb(var(--v-theme-error))' }
    }
    return { backgroundColor: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.28)' }
}

function select(d: Date) {
    if (dateStatus(d) !== 'available') return
    emit('select', d)
}
</script>

<template>
    <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface" :style="{ borderColor: '#e0e0e0' }">
        <v-card-item class="pa-4 pb-2">
            <v-card-title class="text-h5 px-0">Select Date</v-card-title>
            <v-card-subtitle class="mt-1 px-0">Pick a day we're open.</v-card-subtitle>
        </v-card-item>

        <v-card-text class="pa-4 pt-2">
            <div class="d-flex align-center justify-space-between mb-3">
                <v-btn icon="mdi-chevron-left" variant="tonal" density="comfortable" color="primary"
                    :disabled="!canGoPrev" @click="prevMonth"
                    :style="!canGoPrev ? 'cursor: not-allowed; pointer-events: auto;' : ''" />
                <div class="text-subtitle-1 font-weight-bold">{{ calendarTitle }}</div>
                <v-btn icon="mdi-chevron-right" variant="tonal" density="comfortable" color="primary"
                    @click="nextMonth" />
            </div>

            <div class="booking-cal-grid">
                <div v-for="(d, i) in DAY_NAMES" :key="'h-' + i"
                    class="text-center text-caption font-weight-bold text-medium-emphasis py-1">
                    {{ d }}
                </div>
                <div v-for="(cell, i) in cells" :key="'c-' + i" class="booking-cal-cell">
                    <v-tooltip v-if="cell && dateStatus(cell) === 'holiday'" :text="holidayFor(cell)?.name ?? 'Holiday'"
                        location="top">
                        <template #activator="{ props: tooltipProps }">
                            <div v-bind="tooltipProps" class="booking-cal-btn booking-cal-holiday"
                                :style="cellStyle(cell)">
                                <span class="booking-cal-daynum"
                                    :class="isToday(cell) ? 'text-decoration-underline font-weight-bold' : ''">
                                    {{ cell.getDate() }}
                                </span>
                                <span class="booking-cal-badge">{{ holidayFor(cell)?.name ?? 'Libur' }}</span>
                            </div>
                        </template>
                    </v-tooltip>
                    <button v-else-if="cell" type="button" :disabled="dateStatus(cell) !== 'available'"
                        class="booking-cal-btn" :style="cellStyle(cell)" @click="select(cell)">
                        <span :class="isToday(cell) ? 'text-decoration-underline font-weight-bold' : ''">
                            {{ cell.getDate() }}
                        </span>
                    </button>
                    <div v-else></div>
                </div>
            </div>

            <div class="d-flex flex-wrap ga-4 mt-4">
                <div class="d-flex align-center ga-2">
                    <span class="booking-swatch"
                        style="background-color: rgba(var(--v-theme-primary), 0.15); border: 1px solid rgb(var(--v-theme-primary));"></span>
                    <span class="text-caption text-medium-emphasis">Available</span>
                </div>
                <div class="d-flex align-center ga-2">
                    <span class="booking-swatch"
                        style="background-color: rgba(var(--v-theme-error), 0.1); border: 1px solid rgb(var(--v-theme-error));"></span>
                    <span class="text-caption text-medium-emphasis">Holiday</span>
                </div>
                <div class="d-flex align-center ga-2">
                    <span class="booking-swatch"
                        style="background-color: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.12);"></span>
                    <span class="text-caption text-medium-emphasis">Past</span>
                </div>
            </div>

            <div class="d-flex justify-end mt-4">
                <v-btn color="primary" variant="flat" size="large" density="comfortable" :disabled="!selectedDate"
                    @click="emit('next')">
                    Continue
                </v-btn>

            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.booking-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.booking-cal-cell {
    aspect-ratio: 1;
}

.booking-cal-btn {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
}

.booking-cal-btn:not(:disabled):hover {
    opacity: 0.85;
}

.booking-cal-btn:disabled {
    cursor: not-allowed;
}

.booking-swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
}

.booking-cal-holiday {
    flex-direction: column;
    gap: 1px;
    padding: 2px;
    cursor: not-allowed;
}

.booking-cal-daynum {
    font-size: 0.85rem;
    line-height: 1;
}

.booking-cal-badge {
    font-size: 0.5rem;
    background: red;
    color: #fff;
    padding: 1px 4px;
    border-radius: 5px;
    max-width: 92%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.1;
}
</style>
