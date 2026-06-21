<template>
    <div class="logo">
        <NuxtLink to="/dashboard" aria-label="HealthData logo">
            <svg width="180" height="40" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="2" width="36" height="36" rx="7" fill="rgba(99,102,241,0.08)" />
                <line x1="5" y1="20" x2="31" y2="20" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"
                    stroke-dasharray="2,2" />

                <polyline points="5,20 9,20 12,9 15,31 18,20 22,20 25,14 28,20 31,20" fill="none" :stroke="primary"
                    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="9" r="2" :fill="primary" />
                <circle cx="15" cy="31" r="1.5" :fill="primary" />
                <circle cx="25" cy="14" r="1.5" :fill="primary" />

                <circle cx="31" cy="20" r="2" fill="none" :stroke="primary" stroke-width="1.8" />
                <text x="44" y="26" font-size="20" font-weight="1000" fill="#1a1a1a">Health</text>
                <text x="106" y="26" font-size="20" font-weight="1000" :fill="primary">Data</text>
            </svg>
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
const primary = ref('rgb(var(--v-theme-primary))')
</script>