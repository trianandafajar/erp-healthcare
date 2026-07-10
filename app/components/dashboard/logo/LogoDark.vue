<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const auth = useAuthStore()
const profile = useProfileStore()

const isSuperadmin = computed(() => !route.params.slug)

const dashboardLink = computed(() => {
  if (isSuperadmin.value) {
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

const displayName = computed(() => profile.settings?.display_name)
const logoUrl = computed(() => profile.settings?.logo_url)
const hasBranding = computed(() => !isSuperadmin.value && (displayName.value || logoUrl.value))
</script>
<template>
  <div class="logo">
    <NuxtLink :to="dashboardLink" aria-label="HealthData logo" class="d-flex align-center ga-2 text-decoration-none">
      <img v-if="logoUrl" :src="logoUrl" alt="Logo" height="36" width="36" style="display:block" />
      <img v-else src="/logo.png" alt="HealthData" height="36" style="display:block" />

      <span v-if="hasBranding" style="font-size:18px;font-weight:800;color:#1a1a1a">
        {{ displayName }}
      </span>
      <span v-else style="font-size:18px;font-weight:800;color:#1a1a1a">
        Health<span :style="{ color: `rgb(var(--v-theme-primary))` }">Data</span>
      </span>
    </NuxtLink>
  </div>
</template>
