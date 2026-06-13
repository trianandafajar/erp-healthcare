<script setup lang="ts">
import { ref, computed } from 'vue';
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue';

definePageMeta({
    middleware: ['auth'],
})

interface ActivityLog {
    id: string
    action: string
    module: string
    entity_id: string | null
    description: string
    created_at: string
    actor_name: string
    actor_email: string | null
}

const search = ref('');
const actionFilter = ref('all');
const moduleFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;

const { data, pending } = await useFetch<{ logs: any[] }>('/api/activity-logs')

const logs = computed<ActivityLog[]>(() =>
    (data.value?.logs ?? []).map((l) => ({
        id: l.id,
        action: l.action,
        module: l.module,
        entity_id: l.entity_id ?? null,
        description: l.description ?? '-',
        created_at: l.created_at,
        actor_name: l.actor_name ?? 'System',
        actor_email: l.actor_email ?? null,
    }))
)

const actionOptions = [
    { label: 'All', value: 'all' },
    { label: 'Create', value: 'create' },
    { label: 'Update', value: 'update' },
    { label: 'Delete', value: 'delete' },
]

const moduleOptions = computed(() => {
    const modules = new Set(logs.value.map(l => l.module))
    return [{ label: 'All Modules', value: 'all' }, ...Array.from(modules).map(m => ({ label: m, value: m }))]
})

const actionConfig: Record<string, { color: string, icon: string, label: string }> = {
    create: { color: 'success', icon: 'mdi-plus-circle-outline', label: 'Create' },
    update: { color: 'warning', icon: 'mdi-pencil-outline', label: 'Update' },
    delete: { color: 'error', icon: 'mdi-delete-outline', label: 'Delete' },
}

const filteredLogs = computed(() => {
    return logs.value.filter((l) => {
        const matchAction = actionFilter.value === 'all' || l.action === actionFilter.value
        const matchModule = moduleFilter.value === 'all' || l.module === moduleFilter.value
        const matchSearch =
            l.description.toLowerCase().includes(search.value.toLowerCase()) ||
            l.actor_name.toLowerCase().includes(search.value.toLowerCase())
        return matchAction && matchModule && matchSearch
    })
})

const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredLogs.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage));

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
    return formatDateTime(dateStr)
}

function onFilterChange() {
    currentPage.value = 1;
}
</script>

<template>
    <v-card-item class="pb-2 px-0 pt-0">
        <div>
            <v-card-title class="text-h3">Activity Log</v-card-title>
            <v-card-subtitle class="mt-1">Track recent changes made across the system</v-card-subtitle>
        </div>
    </v-card-item>

    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <div class="d-flex align-center justify-space-between gap-3 px-4 py-3 flex-wrap">
            <v-text-field v-model="search" placeholder="Search by description or actor..."
                prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable
                style="max-width: 320px" @update:model-value="onFilterChange" />

            <div class="d-flex ga-2 flex-wrap">
                <v-select v-model="actionFilter" :items="actionOptions" item-title="label" item-value="value"
                    variant="outlined" density="compact" hide-details style="min-width: 140px"
                    @update:model-value="onFilterChange" />

                <v-select v-model="moduleFilter" :items="moduleOptions" item-title="label" item-value="value"
                    variant="outlined" density="compact" hide-details style="min-width: 160px"
                    @update:model-value="onFilterChange" />
            </div>
        </div>

        <v-divider />

        <v-table class="bordered-table" hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Actor</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Action</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Module</th>
                    <th class="text-left text-caption font-weight-bold text-uppercase">Description</th>
                    <th class="text-right text-caption font-weight-bold text-uppercase">Time</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="5" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="paginatedLogs.length === 0">
                    <td colspan="5" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-history" size="32" class="mb-2 d-block mx-auto" />
                        No activity recorded
                    </td>
                </tr>
                <tr v-else v-for="log in paginatedLogs" :key="log.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" color="primary" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(log.actor_name) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ log.actor_name }}</div>
                                <div v-if="log.actor_email" class="text-caption text-medium-emphasis">
                                    {{ log.actor_email }}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip :color="actionConfig[log.action]?.color ?? 'secondary'" variant="tonal" size="small">
                            <template #prepend>
                                <v-icon :icon="actionConfig[log.action]?.icon ?? 'mdi-information-outline'" size="14"
                                    class="mr-1" />
                            </template>
                            {{ actionConfig[log.action]?.label ?? log.action }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <v-chip size="small" variant="tonal" color="secondary" label class="text-capitalize">
                            {{ log.module }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-body-2">
                        {{ log.description }}
                    </td>
                    <td class="py-3 text-right">
                        <v-tooltip location="top">
                            <template #activator="{ props }">
                                <span v-bind="props" class="text-caption text-medium-emphasis">
                                    {{ timeAgo(log.created_at) }}
                                </span>
                            </template>
                            {{ formatDateTime(log.created_at) }}
                        </v-tooltip>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
                Showing {{ paginatedLogs.length }} of {{ filteredLogs.length }} activities
            </span>
            <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" density="compact"
                size="small" />
        </div>
    </UiTitleCard>
</template>