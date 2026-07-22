<script setup lang="ts">
const rows = 6
const cols = 7
const dayHeaders = Array.from({ length: cols }, (_, i) => i)
</script>

<template>
    <v-card elevation="0">
        <v-card-text>
            <div class="skeleton-title" />
            <div class="skeleton-subtitle" />
        </v-card-text>
    </v-card>

    <v-card elevation="0" class="mt-4">
        <v-card-text>
            <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-3">
                <div class="d-flex align-center gap-2">
                    <div class="skeleton-icon-btn" />
                    <div class="skeleton-icon-btn" />
                    <div class="skeleton-today-btn" />
                </div>
                <div class="skeleton-cal-title" />
                <div class="skeleton-refresh-btn" />
            </div>

            <div class="superadmin-calendar-shell">
                <table class="skeleton-calendar">
                    <thead>
                        <tr>
                            <th class="text-no-wrap" v-for="d in dayHeaders" :key="d">
                                <span class="skeleton-day-header" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in rows" :key="r">
                            <td v-for="c in cols" :key="c">
                                <div class="skeleton-day-cell">
                                    <div class="skeleton-day-number" />
                                    <div v-if="(r === 2 && c === 3) || (r === 4 && c === 5)" class="skeleton-event" />
                                    <div v-if="r === 4 && c === 5" class="skeleton-event skeleton-event-2" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </v-card-text>
    </v-card>
</template>

<style scoped>
@keyframes skeleton-pulse {
    0% {
        opacity: 0.55;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.55;
    }
}

.skeleton-title,
.skeleton-subtitle,
.skeleton-icon-btn,
.skeleton-today-btn,
.skeleton-cal-title,
.skeleton-refresh-btn,
.skeleton-day-header,
.skeleton-day-number,
.skeleton-event {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton-title {
    width: 180px;
    height: 28px;
    border-radius: 6px;
    margin-bottom: 8px;
}

.skeleton-subtitle {
    width: 280px;
    height: 14px;
    border-radius: 4px;
}

.skeleton-icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.skeleton-today-btn {
    width: 72px;
    height: 36px;
    border-radius: 8px;
}

.skeleton-cal-title {
    width: 140px;
    height: 24px;
    border-radius: 6px;
}

.skeleton-refresh-btn {
    width: 110px;
    height: 36px;
    border-radius: 8px;
}

.superadmin-calendar-shell {
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    overflow: hidden;
}

.skeleton-calendar {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.skeleton-calendar th {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    padding: 10px 0;
    text-align: center;
}

.skeleton-calendar th:last-child {
    border-right: none;
}

.skeleton-day-header {
    display: inline-block;
    width: 32px;
    height: 10px;
}

.skeleton-calendar td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    vertical-align: top;
    height: 80px;
}

.skeleton-calendar tr:last-child td {
    border-bottom: none;
}

.skeleton-calendar td:last-child {
    border-right: none;
}

.skeleton-day-cell {
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
}

.skeleton-day-number {
    width: 18px;
    height: 14px;
    margin-bottom: 2px;
}

.skeleton-event {
    width: 90%;
    height: 16px;
    border-radius: 4px;
}

.skeleton-event-2 {
    width: 70%;
}
</style>