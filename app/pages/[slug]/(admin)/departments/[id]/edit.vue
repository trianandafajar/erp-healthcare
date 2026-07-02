<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['auth', 'permission'],
    permissions: ['department.edit'],
})

const route = useRoute()
const id = route.params.id as string
const isCreate = id === 'create'

const { data, pending } = isCreate
    ? { data: ref(null), pending: ref(false) }
    : await useFetch(`/api/departments/${id}`)

const department = computed(() => data.value)

const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const form = reactive({
    name: '',
    code: '',
    description: '',
})

watch(data, (val) => {
    if (!val) return
    form.name = val.name ?? ''
    form.code = val.code ?? ''
    form.description = val.description ?? ''
}, { immediate: true })

function notify(message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
}

async function save() {
    if (!form.name.trim()) {
        notify('Department name is required', 'error')
        return
    }
    saving.value = true
    try {
        if (isCreate) {
            const res = await $fetch<any>('/api/departments', {
                method: 'POST',
                body: { name: form.name, code: form.code || null, description: form.description || null },
            })
            notify('Department created')
            await navigateTo(`/departments/${res.data.id}`)
        } else {
            await $fetch(`/api/departments/${id}`, {
                method: 'PATCH',
                body: { name: form.name, code: form.code || null, description: form.description || null },
            })
            notify('Department updated')
            await navigateTo({
                path: `/departments/${id}`,
                query: { refresh: Date.now().toString() },
            })
        }
    } catch (e: any) {
        notify(e?.data?.message ?? 'Failed to save', 'error')
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div v-if="pending" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
        <!-- Header -->
        <v-card variant="flat" class="mb-4">
            <v-card-item class="pa-5">
                <div class="d-flex align-center ga-4">
                    <v-btn icon="mdi-arrow-left" variant="text"
                        @click="navigateTo(isCreate ? '/departments' : `/departments/${id}`)" />
                    <v-avatar size="48" color="primary" variant="tonal">
                        <v-icon icon="mdi-hospital-building" size="24" />
                    </v-avatar>
                    <div>
                        <div class="text-h6 font-weight-bold">
                            {{ isCreate ? 'Add Department' : (form.name || department?.name || '-') }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ isCreate ? 'Create a new department' : 'Edit department details' }}
                        </div>
                    </div>
                </div>
            </v-card-item>
        </v-card>

        <v-row>
            <v-col cols="12" md="8">
                <v-card variant="flat">
                    <v-card-item>
                        <template #prepend>
                            <v-avatar color="primary" variant="tonal" size="36">
                                <v-icon icon="mdi-hospital-building" size="20" />
                            </v-avatar>
                        </template>
                        <v-card-title class="text-body-1">Department Information</v-card-title>
                    </v-card-item>
                    <v-divider />
                    <v-card-text class="pa-5">
                        <v-row>
                            <v-col cols="12">
                                <v-label class="text-caption font-weight-medium mb-1">
                                    Department Name <span class="text-error">*</span>
                                </v-label>
                                <v-text-field v-model="form.name" placeholder="e.g. Pediatrics Clinic"
                                    variant="outlined" density="compact" hide-details="auto"
                                    prepend-inner-icon="mdi-hospital-building"
                                    :rules="[v => !!v || 'Name is required']" />
                            </v-col>
                            <v-col cols="12" sm="4" class="mt-3">
                                <v-label class="text-caption font-weight-medium mb-1">
                                    Code
                                    <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                                </v-label>
                                <v-text-field v-model="form.code" placeholder="e.g. PED" variant="outlined"
                                    density="compact" hide-details prepend-inner-icon="mdi-tag-outline" />
                            </v-col>
                            <v-col cols="12" class="mt-3">
                                <v-label class="text-caption font-weight-medium mb-1">
                                    Description
                                    <span class="text-medium-emphasis font-weight-regular">(optional)</span>
                                </v-label>
                                <v-textarea v-model="form.description"
                                    placeholder="Brief description of this department..." variant="outlined"
                                    density="compact" rows="4" hide-details auto-grow />
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card variant="flat">
                    <v-card-text class="pa-5">
                        <v-btn  block color="primary" size="large"
                            :prepend-icon="isCreate ? 'mdi-plus' : 'mdi-content-save'" :loading="saving" @click="save">
                            {{ isCreate ? 'Create Department' : 'Save Changes' }}
                        </v-btn>
                        <v-btn block variant="tonal" class="mt-2"
                            @click="navigateTo(isCreate ? '/departments' : `/departments/${id}`)">
                            Cancel
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </template>
</template>
