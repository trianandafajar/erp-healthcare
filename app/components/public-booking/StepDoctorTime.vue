<script setup lang="ts">
import { computed } from 'vue'

interface Doctor {
    id: string
    full_name: string
    specialization: string | null
    department_id: string | null
    department_name: string | null
    photo_url: string | null
}

const props = defineProps<{
    doctors: Doctor[]
    doctorSlots: Record<string, string[]>
    selectedDoctor: string | null
    selectedSlot: string | null
    loading: boolean
    selectedDate: Date | null
    specializations: string[]
    specializationFilter: string
}>()

const emit = defineEmits<{
    (e: 'select-slot', doctorId: string, slot: string): void
    (e: 'update:specializationFilter', value: string): void
    (e: 'next'): void
    (e: 'back'): void
}>()

const canContinue = computed(() => !!props.selectedDoctor && !!props.selectedSlot)

function formatTime(t: string): string {
    const parts = (t ?? '').split(':')
    if (parts.length < 2) return t
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (Number.isNaN(h) || Number.isNaN(m)) return t
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

const selectedDateLabel = computed(() => {
    if (!props.selectedDate) return ''
    return props.selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
})

function isSelected(doctorId: string, slot: string): boolean {
    return props.selectedDoctor === doctorId && props.selectedSlot === slot
}
</script>

<template>
    <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface" :style="{ borderColor: '#e0e0e0' }">
        <v-card-item class="pa-4 pb-2">
            <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                <div>
                    <v-card-title class="text-h5 px-0">Seladdect Doctor & Time</v-card-title>
                    <v-card-subtitle class="mt-1 px-0">
                        {{ selectedDateLabel || 'Select a date first' }}
                    </v-card-subtitle>
                </div>
                <v-select v-if="specializations.length" :model-value="specializationFilter" :items="specializations"
                    label="Specialization" variant="outlined" density="compact" clearable hide-details
                    style="max-width: 220px;"
                    @update:model-value="(v: any) => emit('update:specializationFilter', v ?? '')" />
            </div>
        </v-card-item>

        <v-card-text class="pa-4 pt-2">
            <div v-if="loading" class="d-flex justify-center py-12">
                <v-progress-circular indeterminate color="primary" />
            </div>

            <v-empty-state v-else-if="!selectedDate" icon="mdi-calendar-blank-outline" title="Select a date first"
                text="Go back to Step 1 and pick an available date." class="py-8" />

            <v-empty-state v-else-if="doctors.length === 0" icon="mdi-doctor" title="No doctors available on this date"
                text="There are no doctors with open schedules for the selected date." class="py-8" />

            <div v-else class="d-flex flex-column ga-3">
                <v-card v-for="doc in doctors" :key="doc.id" variant="outlined" rounded="md" class="bg-surface"
                    :style="{ borderColor: '#e0e0e0' }">
                    <v-card-item class="pa-4 pb-2">
                        <div class="d-flex align-center ga-3">
                            <v-avatar color="primary" variant="flat" size="44">
                                <v-icon icon="mdi-doctor" size="24" color="on-primary" />
                            </v-avatar>
                            <div class="flex-grow-1 min-w-0">
                                <div class="text-subtitle-1 font-weight-bold text-truncate">{{ doc.full_name }}</div>
                                <div class="text-caption text-medium-emphasis text-truncate">
                                    {{ doc.specialization || 'General' }}
                                    <template v-if="doc.department_name"> • {{ doc.department_name }}</template>
                                </div>
                            </div>
                        </div>
                    </v-card-item>

                    <v-card-text class="pa-4 pt-0">
                        <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
                            Available Times
                        </div>
                        <div v-if="(doctorSlots[doc.id] ?? []).length === 0" class="text-caption text-medium-emphasis">
                            No available times.
                        </div>
                        <div v-else class="d-flex flex-wrap ga-2">
                            <v-chip v-for="slot in doctorSlots[doc.id] ?? []" :key="slot"
                                :color="isSelected(doc.id, slot) ? 'primary' : undefined"
                                :variant="isSelected(doc.id, slot) ? 'flat' : 'tonal'"
                                :append-icon="isSelected(doc.id, slot) ? 'mdi-check' : undefined" rounded="sm"
                                @click="emit('select-slot', doc.id, slot)">
                                {{ formatTime(slot) }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <div class="d-flex justify-space-between mt-4">
                <v-btn variant="tonal" color="secondary" size="large" @click="emit('back')">
                Back
                </v-btn>
                <v-btn color="primary" variant="flat" size="large" :disabled="!canContinue" @click="emit('next')">
                    Continue
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>
