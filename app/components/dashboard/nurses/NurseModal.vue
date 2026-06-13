<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Nurse {
    id: string
    full_name: string
    email: string
    phone: string
    photo_url: string
    experience_years: number
    is_available: boolean
    department: { id: string; name: string; code?: string } | null
    created?: string
}

interface AvailableUser {
    id: string
    full_name: string
    email: string
}

interface Department {
    id: string
    name: string
    code?: string
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    nurse?: Nurse | null
    availableUsers?: AvailableUser[]
    departments?: Department[]
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const form = ref({
    id: '',
    department_id: null as string | null,
    phone: '',
    photo_url: '',
    experience_years: 0,
    is_available: true,
})

watch(
    () => props.nurse,
    (nurse) => {
        if (nurse && props.mode === 'edit') {
            form.value = {
                id: nurse.id,
                department_id: nurse.department?.id ?? null,
                phone: nurse.phone ?? '',
                photo_url: nurse.photo_url ?? '',
                experience_years: nurse.experience_years ?? 0,
                is_available: nurse.is_available ?? true,
            }
        } else if (props.mode === 'add') {
            form.value = {
                id: '',
                department_id: null,
                phone: '',
                photo_url: '',
                experience_years: 0,
                is_available: true,
            }
        }
    },
    { immediate: true }
)

const config = computed(() => ({
    add: {
        title: 'Add New Nurse',
        icon: 'mdi-doctor',
        confirmColor: 'primary',
        confirmLabel: 'Create Nurse',
    },
    edit: {
        title: 'Edit Nurse',
        icon: 'mdi-pencil-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Remove Nurse',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Remove Nurse',
    },
}[props.mode]))

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.nurse?.id,
        })
        return
    }

    emit('submit', {
        ...form.value,
        id: props.mode === 'add' ? form.value.id : props.nurse?.id,
    })
}
</script>

<template>
    <v-card rounded="lg" max-width="600" width="100%">
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
                            Are you sure you want to remove this nurse's profile?
                        </p>

                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ nurse?.full_name }}</strong>
                            ({{ nurse?.email }})
                            will be removed from the nurses list. The user account itself will not be deleted.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4" style="max-height: 520px; overflow-y: auto;">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">
                            User Account
                        </v-label>

                        <v-select v-if="mode === 'add'" v-model="form.id" :items="availableUsers ?? []"
                            item-title="full_name" item-value="id" placeholder="Select a user with nurse role"
                            variant="outlined" density="compact" hide-details="auto"
                            no-data-text="No available users with nurse role">
                            <template #item="{ props: itemProps, item }">
                                <v-list-item v-bind="itemProps" :subtitle="item.raw.email" />
                            </template>
                        </v-select>

                        <v-text-field v-else :model-value="`${nurse?.full_name} (${nurse?.email})`" variant="outlined"
                            density="compact" hide-details disabled />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Department / Poli
                        </v-label>

                        <v-select v-model="form.department_id" :items="departments ?? []" item-title="name"
                            item-value="id" placeholder="Select department" variant="outlined" density="compact"
                            hide-details clearable />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Phone
                        </v-label>

                        <v-text-field v-model="form.phone" placeholder="e.g. 081234567890" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Photo URL
                        </v-label>

                        <v-text-field v-model="form.photo_url" placeholder="https://..." variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="6" sm="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Experience (years)
                        </v-label>

                        <v-text-field v-model.number="form.experience_years" type="number" min="0" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-switch v-model="form.is_available" color="success" label="Available for consultation"
                            hide-details density="compact" />
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

            <v-btn variant="flat" :color="config.confirmColor" :disabled="mode === 'add' && !form.id" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>