<script setup lang="ts">
import DashboardCharts from '~/components/dashboard/DashboardCharts.vue';
import RecentActivity from '~/components/dashboard/RecentActivity.vue';
import WidgetFive from '~/components/dashboard/WidgetFive.vue';
</script>

<template>
    <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }">
        <v-card elevation="0">
            <v-card-text>
                <div class="text-h5 font-weight-bold">Admin Dashboard</div>
                <div class="text-caption text-medium-emphasis">Overview daily web activity</div>
            </v-card-text>
        </v-card>
    </v-card>

    <WidgetFive />

    <DashboardCharts />

    <RecentActivity />
</template>