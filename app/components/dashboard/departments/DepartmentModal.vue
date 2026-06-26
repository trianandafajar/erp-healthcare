<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Department {
    id: string
    name: string
    code: string
    description: string
}

const props = defineProps<{
    mode: 'add' | 'delete'
    department?: Department | null
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    name: '',
    code: '',
    description: '',
})

watch(
    () => props.department,
    (department) => {
        if (props.mode === 'add') {
            form.value = { name: '', code: '', description: '' }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add New Department',
        icon: 'mdi-hospital-building',
        confirmColor: 'primary',
        confirmLabel: 'Create Department',
    },
    delete: {
        title: 'Delete Department',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Delete Department',
    },
}[props.mode]))

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.department?.id,
        })
        return
    }

    emit('submit', {
        id: props.department?.id,
        name: form.value.name,
        code: form.value.code,
        description: form.value.description,
    })
}
</script>

<template>
    <v-card rounded="lg" max-width="500" width="100%">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">
                    {{ config.title }}
                </span>
            </div>

            <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
        </v-card-title>

        <v-divider />

        <template v-if="mode === 'delete'">
            <v-card-text class="pa-5">
                <div class="d-flex flex-column align-center text-center ga-3">
                    <v-avatar color="error" variant="tonal" size="56">
                        <v-icon icon="mdi-delete-outline" size="28" />
                    </v-avatar>

                    <div>
                        <p class="text-body-1 font-weight-medium">
                            Are you sure you want to delete this department?
                        </p>

                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ department?.name }}</strong>
                            <template v-if="department?.code && department.code !== '-'">
                                ({{ department.code }})
                            </template>
                            will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Department Name
                        </v-label>

                        <v-text-field v-model="form.name" p placeholder="e.g. Pediatrics Clinic" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Code
                        </v-label>

                        <v-text-field v-model="form.code" placeholder="e.g. PED" variant="outlined" density="compact"
                            hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Description
                        </v-label>

                        <v-textarea v-model="form.description" placeholder="Optional" variant="outlined"
                            density="compact" rows="3" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />

            <v-btn variant="tonal" color="secondary" @click="emit('cancel')">
                Cancel
            </v-btn>

            <v-btn variant="flat" :color="config.confirmColor" :loading="loading" :disabled="loading"
                :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>