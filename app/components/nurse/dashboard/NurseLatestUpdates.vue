<script setup lang="ts">
type UpdateItem = {
    kind: 'Vital' | 'Note' | 'Procedure'
    title: string
    detail: string
    time: string
}

defineProps<{
    items: UpdateItem[]
    loading: boolean
}>()

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function itemColor(kind: UpdateItem['kind']) {
    if (kind === 'Vital') return 'error'
    if (kind === 'Note') return 'secondary'
    return 'info'
}
</script>

<template>
    <v-card elevation="0">
        <v-card-item class="pb-2">
            <v-card-title class="text-h5">Latest Updates</v-card-title>
            <v-card-subtitle>Recent activity from the care area</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4">
            <template v-if="loading">
                <v-skeleton-loader type="list-item-avatar-three-line, list-item-avatar-three-line, list-item-avatar-three-line" />
            </template>
            <div v-for="item in items" :key="`${item.kind}-${item.title}-${item.time}`" class="d-flex align-center justify-space-between ga-3">
                <div>
                    <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.detail }}</div>
                </div>
                <div class="text-right">
                    <v-chip size="small" variant="tonal" :color="itemColor(item.kind)">
                        {{ item.kind }}
                    </v-chip>
                    <div class="text-caption text-medium-emphasis mt-2">{{ formatRelativeTime(item.time) }}</div>
                </div>
            </div>
            <div v-if="!loading && items.length === 0" class="text-center py-6 text-medium-emphasis">
                No recent activity yet.
            </div>
        </v-card-text>
    </v-card>
</template>
