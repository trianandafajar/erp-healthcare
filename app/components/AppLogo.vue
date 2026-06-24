<template>
    <div class="logo">
        <NuxtLink to="/dashboard" aria-label="HealthData logo" class="d-flex align-center ga-2 text-decoration-none">
            <img src="/logo.svg" alt="HealthData" height="36" style="display: block;" />
            <span style="font-size: 18px; font-weight: 800; color: #1a1a1a;">
                Health<span :style="{ color: `rgb(var(--v-theme-primary))` }">Data</span>
            </span>
        </NuxtLink>
    </div>
</template>