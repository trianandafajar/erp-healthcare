<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Permission {
    id: string
    name: string
    label: string
    module: string
    category?: string | null
}

const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    permission?: Permission | null
    moduleKeys?: string[]
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()

const categoryOptions = [
    { title: 'Admin', value: 'admin' },
    { title: 'Doctor', value: 'doctor' },
    { title: 'Nurse', value: 'nurse' },
    { title: 'Patient', value: 'patient' },
    { title: 'Pharmacy', value: 'pharmacy' },
    { title: 'Receptionist', value: 'receptionist' },
]

const defaultModules = ['general', 'user', 'role', 'doctor', 'nurse', 'patient', 'department', 'report']

const moduleOptions = computed(() => {
    const merged = new Set([...defaultModules, ...(props.moduleKeys ?? [])])
    return [...merged]
})

const form = ref({
    category: null as string | null,
    module: '' as string,
    action: '' as string, // the part after "module."
    label: '',
})

// Derived final permission name, e.g. module="doctor", action="view" -> "doctor.view"
const fullName = computed(() => {
    if (!form.value.module || !form.value.action) return ''
    return `${form.value.module}.${form.value.action}`.toLowerCase()
})

watch(
    () => props.permission,
    (permission) => {
        if (permission && props.mode === 'edit') {
            const [mod, ...rest] = permission.name.split('.')
            form.value = {
                category: permission.category ?? null,
                module: permission.module ?? mod ?? '',
                action: rest.join('.') ?? '',
                label: permission.label,
            }
        } else if (props.mode === 'add') {
            form.value = { category: null, module: '', action: '', label: '' }
        }
    },
    { immediate: true }
)

// Keep the action input clean: lowercase, no spaces, letters/underscore only
watch(() => form.value.action, (val) => {
    const cleaned = val.toLowerCase().replace(/[^a-z_]/g, '')
    if (cleaned !== val) form.value.action = cleaned
})

const config = computed(() => ({
    add: {
        title: 'Add new Permission',
        icon: 'mdi-key-plus',
        confirmColor: 'primary',
        confirmLabel: 'Create Permission',
    },
    edit: {
        title: 'Edit Permission',
        icon: 'mdi-key-outline',
        confirmColor: 'primary',
        confirmLabel: 'Save Changes',
    },
    delete: {
        title: 'Delete Permission',
        icon: 'mdi-delete-outline',
        confirmColor: 'error',
        confirmLabel: 'Delete Permission',
    },
}[props.mode]))

const isValid = computed(() => {
    return !!form.value.module && !!form.value.action.trim() && !!form.value.label.trim()
})

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.permission?.id,
        })
        return
    }

    if (!isValid.value) return

    emit('submit', {
        id: props.permission?.id,
        name: fullName.value,
        label: form.value.label,
        module: form.value.module,
        category: form.value.category,
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
                            Are you sure you want to delete this permission?
                        </p>

                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ permission?.label }}</strong>
                            ({{ permission?.name }})
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
                            Category (Dashboard)
                        </v-label>

                        <v-select v-model="form.category" :items="categoryOptions" item-title="title" item-value="value"
                            placeholder="Which dashboard is this for?" variant="outlined" density="compact" hide-details
                            clearable />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Module
                        </v-label>

                        <v-combobox v-model="form.module" :items="moduleOptions" placeholder="e.g. patient"
                            variant="outlined" density="compact" hide-details="auto" :disabled="mode === 'edit'" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Permission Name
                        </v-label>

                        <div class="d-flex align-center ga-2">
                            <v-chip v-if="form.module" variant="tonal" color="primary" label class="font-mono">
                                {{ form.module }}.
                            </v-chip>
                            <v-text-field v-model="form.action"
                                :placeholder="form.module ? 'e.g. view' : 'Select a module first'" variant="outlined"
                                density="compact" hide-details="auto" :disabled="!form.module || mode === 'edit'" />
                        </div>

                        <div v-if="fullName" class="text-caption text-medium-emphasis mt-1">
                            Full identifier: <span class="font-mono">{{ fullName }}</span>
                        </div>
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Display Label
                        </v-label>

                        <v-text-field v-model="form.label" placeholder="e.g. View Patients" variant="outlined"
                            density="compact" hide-details />
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

            <v-btn variant="flat" :color="config.confirmColor" :disabled="mode !== 'delete' && !isValid"
                @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
.font-mono {
    font-family: 'Courier New', monospace;
    font-size: 12px;
}
</style>
