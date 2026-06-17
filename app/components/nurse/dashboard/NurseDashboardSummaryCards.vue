<script setup lang="ts">
type SummaryCard = {
    title: string
    value: string
    caption: string
    to: string
    color: string
}

const props = defineProps<{
    cards: SummaryCard[]
    pendingMap: Record<string, boolean>
}>()

function isPending(title: string) {
    return props.pendingMap[title] ?? false
}
</script>

<template>
    <v-row>
        <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" lg="3">
            <v-card elevation="0" :to="card.to" class="h-100 dashboard-summary-card">
                <v-card-text class="d-flex flex-column ga-2">
                    <template v-if="isPending(card.title)">
                        <v-skeleton-loader type="heading, text, text" />
                    </template>
                    <template v-else>
                        <div class="text-caption text-medium-emphasis text-uppercase">{{ card.title }}</div>
                        <div class="text-h3 font-weight-bold">{{ card.value }}</div>
                        <div class="text-body-2 text-medium-emphasis">{{ card.caption }}</div>
                    </template>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<style scoped>
.dashboard-summary-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: none;
}
</style>
