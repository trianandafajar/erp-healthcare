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
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>
</template>
