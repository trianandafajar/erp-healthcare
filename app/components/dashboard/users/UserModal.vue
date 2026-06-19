<script setup lang="ts">
const props = defineProps<{
    mode: 'add' | 'edit' | 'delete'
    user?: {
        id: string
        name: string
        email: string
        role: string
        status: string
    } | null
}>()

const emit = defineEmits<{
    (e: 'submit', data: any): void
    (e: 'cancel'): void
}>()
const { data } = await useFetch<{ roles: any[] }>('/api/roles')

const roles = computed(() =>
    (data.value?.roles ?? []).map((r) => ({
        id: r.id,
        name: r.name ?? '-',
        label: r.label ?? '-',
    }))
)

const form = ref({
    full_name: '',
    email: '',
    role: 'patient',
    status: 'active'
})

watch(() => props.user, (u) => {
    if (u && props.mode === 'edit') {
        form.value = {
            full_name: u.name,
            email: u.email,
            role: u.role,
            status: u.status
        }
    } else {
        form.value = { full_name: '', email: '', role: 'patient', status: 'active' }
    }
}, { immediate: true })

const config = computed(() => {
    const map = {
        add: { title: 'Add New User', icon: 'mdi-account-plus', confirmColor: 'primary', confirmLabel: 'Add User' },
        edit: { title: 'Edit User', icon: 'mdi-account-edit', confirmColor: 'primary', confirmLabel: 'Save Changes' },
        delete: { title: 'Delete User', icon: 'mdi-account-remove', confirmColor: 'error', confirmLabel: 'Delete' }
    }
    return map[props.mode]
})

function onSubmit() {
    if (props.mode === 'delete') {
        emit('submit', { id: props.user?.id })
    } else {
        emit('submit', { ...form.value, id: props.user?.id })
    }
}
</script>

<template>
    <v-card rounded="lg" min-width="480">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="d-flex align-center ga-2">
                <v-icon :icon="config.icon" size="20" />
                <span class="text-h6 font-weight-bold">{{ config.title }}</span>
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
                        <p class="text-body-1 font-weight-medium">Are you sure you want to delete this user?</p>
                        <p class="text-body-2 text-medium-emphasis mt-1">
                            <strong>{{ user?.name }}</strong> ({{ user?.email }}) will be permanently removed.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </template>

        <template v-else>
            <v-card-text class="pa-4">
                <v-row dense>
                    <v-col cols="12">
                        <v-label class="text-caption font-weight-medium mb-1">Full Name</v-label>
                        <v-text-field v-model="form.full_name" placeholder="e.g. John Doe" variant="outlined"
                            density="compact" hide-details="auto" />
                    </v-col>
                    <v-col cols="12" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Email</v-label>
                        <v-text-field v-model="form.email" placeholder="e.g. john@example.com" variant="outlined"
                            density="compact" hide-details="auto" type="email" :disabled="mode === 'edit'" />
                    </v-col>
                    <v-col cols="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Role</v-label>
                        <v-select v-model="form.role" :items="roles" item-title="label" item-value="name"
                            variant="outlined" density="compact" hide-details />
                    </v-col>
                    <v-col cols="6" class="mt-3">
                        <v-label class="text-caption font-weight-medium mb-1">Status</v-label>
                        <v-select v-model="form.status"
                            :items="[{ title: 'Active', value: 'active' }, { title: 'Inactive', value: 'inactive' }]"
                            variant="outlined" density="compact" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
        </template>

        <v-divider />

        <v-card-actions class="pa-4 pt-3">
            <v-spacer />
            <v-btn variant="tonal" color="secondary" @click="emit('cancel')">Cancel</v-btn>
            <v-btn variant="flat" :color="config.confirmColor" @click="onSubmit">
                {{ config.confirmLabel }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>
