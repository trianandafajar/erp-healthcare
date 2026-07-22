<script setup lang="ts">
import { computed } from 'vue'
import UiTitleCard from '~/components/dashboard/UiTitleCard.vue'

interface ActivityItem {
    id: string
    full_name: string
    email: string
    status: string
    role: string | null
    role_label: string
    created_at: string
}

const { data, pending } = await useFetch<{ recentActivity: ActivityItem[] }>('/api/dashboard/stats')

const recentActivity = computed(() => data.value?.recentActivity ?? [])

const roleColors: Record<string, string> = {
    admin: 'error',
    doctor: 'primary',
    specialist: 'purple',
    pharmacy: 'teal',
    nurse: 'pink',
    staff: 'warning',
    patient: 'success',
}

function getRoleColor(role: string | null) {
    if (!role) return 'secondary'
    return roleColors[role] ?? 'secondary'
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
    <UiTitleCard class-name="px-0 pb-0 rounded-md">
        <v-card-item class="pb-2">
            <v-card-title class="text-h5">Recent Activity</v-card-title>
            <v-card-subtitle>Latest registered users</v-card-subtitle>
        </v-card-item>

        <v-divider />

        <v-table hover density="comfortable">
            <thead class="bg-containerBg">
                <tr>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">User</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Role</th>
                    <th class="text-no-wrap text-left text-caption font-weight-bold text-uppercase">Status</th>
                    <th class="text-no-wrap text-right text-caption font-weight-bold text-uppercase">Joined</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="pending">
                    <td colspan="4" class="text-center py-8">
                        <v-progress-circular indeterminate color="primary" />
                    </td>
                </tr>
                <tr v-else-if="recentActivity.length === 0">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">
                        <v-icon icon="mdi-history" size="32" class="mb-2 d-block mx-auto" />
                        No recent activity
                    </td>
                </tr>
                <tr v-else v-for="item in recentActivity" :key="item.id">
                    <td class="py-3">
                        <div class="d-flex align-center ga-3">
                            <v-avatar size="34" :color="getRoleColor(item.role)" variant="tonal">
                                <span class="text-caption font-weight-bold">{{ getInitials(item.full_name) }}</span>
                            </v-avatar>
                            <div>
                                <div class="text-body-2 font-weight-medium">{{ item.full_name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3">
                        <v-chip :color="getRoleColor(item.role)" variant="tonal" size="small">
                            {{ item.role_label }}
                        </v-chip>
                    </td>
                    <td class="py-3">
                        <v-chip :color="item.status === 'active' ? 'success' : 'default'" variant="tonal" size="small">
                            {{ item.status === 'active' ? 'Active' : 'Inactive' }}
                        </v-chip>
                    </td>
                    <td class="py-3 text-right text-body-2 text-medium-emphasis">
                        {{ formatRelativeTime(item.created_at) }}
                    </td>
                </tr>
            </tbody>
        </v-table>
    </UiTitleCard>
</template>