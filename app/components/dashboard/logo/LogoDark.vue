<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const auth = useAuthStore()

const dashboardLink = computed(() => {
  if (!route.params.slug) {
    return '/super-admin/dashboard'
  }

  switch (auth.user?.role) {
    case 'doctor':
      return '/doctor/dashboard'

    case 'nurse':
      return '/nurse/dashboard'

    case 'pharmacist':
      return '/pharmacy/dashboard'

    case 'receptionist':
      return '/receptionist/dashboard'

    case 'patient':
      return '/patient/dashboard'

    default:
      return `/${route.params.slug}/dashboard`
  }
})
</script>
<template>
  <div class="logo">
    <NuxtLink :to="dashboardLink" aria-label="HealthData logo" class="d-flex align-center ga-2 text-decoration-none">
      <img src="/logo.svg" alt="HealthData" height="36" style="display:block" />

      <span style="font-size:18px;font-weight:800;color:#1a1a1a">
        Health<span :style="{ color: `rgb(var(--v-theme-primary))` }">Data</span>
      </span>
    </NuxtLink>
  </div>
</template>