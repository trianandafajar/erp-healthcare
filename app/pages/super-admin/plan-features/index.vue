<script setup lang="ts">
definePageMeta({
    layout: 'superadmin',
    middleware: ['auth'],
})

useSeoMeta({
    title: 'Plan Features',
    ogTitle: 'Plan Features',
    description: 'Manage features and limits for each pricing plan.',
})

const selectedPlan = ref('starter')
const { data, pending, refresh } = useLazyFetch<any[]>(() => `/api/superadmin/plan-features?plan=${selectedPlan.value}`)

const plans = ['starter', 'basic', 'professional', 'enterprise']

const planColors: Record<string, string> = {
    starter: 'grey',
    basic: 'blue',
    professional: 'primary',
    enterprise: 'purple',
}

const showAddDialog = ref(false)
const newFeature = ref({
    feature_key: '',
    feature_label: '',
    feature_category: 'feature',
    sort_order: 0,
    limit_value: null as number | null,
})

async function addFeature() {
    await $fetch('/api/superadmin/plan-features', {
        method: 'POST',
        body: { ...newFeature.value },
    })
    showAddDialog.value = false
    newFeature.value = { feature_key: '', feature_label: '', feature_category: 'feature', sort_order: 0, limit_value: null }
    refresh()
}

async function toggleAvailability(item: any) {
    await $fetch(`/api/superadmin/plan-features/${item.id}`, {
        method: 'PATCH',
        body: { is_available: !item.is_available },
    })
    refresh()
}

async function updateLimit(item: any) {
    const newVal = prompt('Enter new limit value (-1 for unlimited):', String(item.limit_value ?? ''))
    if (newVal === null) return
    const num = parseInt(newVal, 10)
    if (isNaN(num)) return
    await $fetch(`/api/superadmin/plan-features/${item.id}`, {
        method: 'PATCH',
        body: { limit_value: num },
    })
    refresh()
}

async function deleteFeature(item: any) {
    const ok = confirm(`Delete "${item.feature_label}" from ALL plans?`)
    if (!ok) return
    await $fetch(`/api/superadmin/plan-features/${item.id}`, {
        method: 'DELETE',
    })
    refresh()
}
</script>

<template>
    <v-card elevation="0">
        <v-card-text>
            <div class="text-h5 font-weight-bold">Plan Features</div>
            <div class="text-caption text-medium-emphasis">Manage which features and limits each pricing plan includes.</div>
        </v-card-text>
    </v-card>

    <v-card elevation="0" class="mt-4">
        <v-card-text>
            <div class="d-flex align-center ga-3 mb-4 flex-wrap">
                <v-btn v-for="p in plans" :key="p" :color="selectedPlan === p ? planColors[p] : 'default'"
                    :variant="selectedPlan === p ? 'flat' : 'tonal'" @click="selectedPlan = p"
                    class="text-capitalize">
                    {{ p }}
                </v-btn>
                <v-spacer />
                <v-btn color="success" variant="tonal" prepend-icon="mdi-plus" @click="showAddDialog = true">
                    Add Feature
                </v-btn>
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="refresh()">
                    Refresh
                </v-btn>
            </div>

            <v-skeleton-loader v-if="pending" type="table" />

            <v-table v-else density="comfortable" hover>
                <thead class="bg-containerBg">
                    <tr>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Category</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Feature Key</th>
                        <th class="text-left text-caption font-weight-bold text-uppercase">Label</th>
                        <th class="text-center text-caption font-weight-bold text-uppercase">Available</th>
                        <th class="text-center text-caption font-weight-bold text-uppercase">Limit</th>
                        <th class="text-center text-caption font-weight-bold text-uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in data" :key="item.id">
                        <td>
                            <v-chip size="x-small" variant="tonal" density="comfortable">
                                {{ item.feature_category }}
                            </v-chip>
                        </td>
                        <td><code class="text-caption">{{ item.feature_key }}</code></td>
                        <td class="text-body-2">{{ item.feature_label }}</td>
                        <td class="text-center">
                            <v-switch :model-value="item.is_available" color="primary" density="compact"
                                hide-details @click="toggleAvailability(item)" />
                        </td>
                        <td class="text-center">
                            <v-btn v-if="item.feature_category === 'limit'" variant="text" size="small"
                                color="primary" @click="updateLimit(item)">
                                {{ item.limit_value === -1 ? '∞' : item.limit_value }}
                            </v-btn>
                            <span v-else class="text-caption text-medium-emphasis">—</span>
                        </td>
                        <td class="text-center">
                            <v-btn icon size="x-small" color="error" variant="text" @click="deleteFeature(item)">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>

    <v-dialog v-model="showAddDialog" max-width="500">
        <v-card>
            <v-card-title class="text-h6">Add New Feature</v-card-title>
            <v-card-text>
                <v-text-field v-model="newFeature.feature_key" label="Feature Key" hint="e.g. lab_integration"
                    persistent-hint density="comfortable" class="mb-3" />
                <v-text-field v-model="newFeature.feature_label" label="Feature Label"
                    hint="e.g. Lab Integration" persistent-hint density="comfortable" class="mb-3" />
                <v-select v-model="newFeature.feature_category" :items="['feature', 'limit', 'role']"
                    label="Category" density="comfortable" class="mb-3" />
                <v-text-field v-model.number="newFeature.sort_order" label="Sort Order" type="number"
                    density="comfortable" class="mb-3" />
                <v-text-field v-if="newFeature.feature_category === 'limit'"
                    v-model.number="newFeature.limit_value" label="Limit Value (-1 = unlimited)" type="number"
                    density="comfortable" />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" @click="addFeature">Add</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
