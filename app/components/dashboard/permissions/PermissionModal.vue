<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Permission {
    id: string
    name: string
    label: string
    module: string
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

const form = ref({
    name: '',
    label: '',
    module: '',
})

watch(
    () => props.permission,
    (permission) => {
        if (permission && props.mode === 'edit') {
            form.value = {
                name: permission.name,
                label: permission.label,
                module: permission.module,
            }
        }
    },
    { immediate: true }
)

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

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', {
            id: props.permission?.id,
        })

        return
    }

    emit('submit', {
        id: props.permission?.id,
        name: form.value.name,
        label: form.value.label,
        module: form.value.module,
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
                            Permission Name
                        </v-label>

                        <v-text-field v-model="form.name" placeholder="e.g. users.create" variant="outlined"
                            density="compact" hide-details="auto" :disabled="mode === 'edit'"
                            :rules="[(v) => /^[a-z]+\.[a-z]+$/.test(v) || 'Format: module.action (lowercase, e.g. users.create)']" />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Display Label
                        </v-label>

                        <v-text-field v-model="form.label" placeholder="e.g. Create Users" variant="outlined"
                            density="compact" hide-details />
                    </v-col>

                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">
                            Module
                        </v-label>

                        <v-combobox v-model="form.module" :items="moduleKeys ?? []" placeholder="e.g. users"
                            variant="outlined" density="compact" hide-details />
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

            <v-btn variant="flat" :color="config.confirmColor" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>