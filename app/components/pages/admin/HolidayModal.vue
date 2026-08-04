<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface Holiday {
    id: string
    holiday_date: string
    name: string | null
}

const props = defineProps<{
    mode: 'add' | 'delete'
    holiday?: Holiday | null
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    holiday_date: '',
    name: '',
})

watch(
    () => props.holiday,
    () => {
        if (props.mode === 'add') {
            form.value = { holiday_date: '', name: '' }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add Holiday',
        icon: 'mdi-calendar-star',
        confirmColor: 'primary',
        confirmLabel: 'Add Holiday',
    },
    delete: {
        title: 'Delete Holiday',
        icon: 'mdi-calendar-remove',
        confirmColor: 'error',
        confirmLabel: 'Delete Holiday',
    },
}[props.mode]))

const holidayLabel = computed(() => {
    if (!props.holiday?.holiday_date) return '-'
    return new Date(props.holiday.holiday_date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    })
})

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.holiday?.id })
        return
    }
    emit('submit', {
        holiday_date: form.value.holiday_date,
        name: form.value.name.trim() || null,
    })
}
</script>

<template>
    <v-card rounded="lg" max-width="440" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">{{ config.title }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" :disabled="loading" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5">
                <div class="d-flex flex-column align-center text-center ga-3">
                    <v-avatar color="error" variant="tonal" size="56">
                        <v-icon icon="mdi-calendar-remove" size="28" />
                    </v-avatar>
                    <div>
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to delete this holiday?
                        </p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ holiday?.name || holidayLabel }}</strong>
                            will be removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Date</v-label>
                        <v-text-field v-model="form.holiday_date" type="date" variant="outlined" density="compact"
                            hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Name</v-label>
                        <v-text-field v-model="form.name" placeholder="e.g. Public Holiday" variant="outlined"
                            density="compact" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />
            <v-btn variant="tonal" color="secondary" :disabled="loading" @click="emit('cancel')">
                Cancel
            </v-btn>
            <v-btn variant="flat" :color="config.confirmColor" :loading="loading"                 :disabled="loading || (mode === 'add' && !form.holiday_date)"
                :style="loading || (mode === 'add' && !form.holiday_date) ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>
