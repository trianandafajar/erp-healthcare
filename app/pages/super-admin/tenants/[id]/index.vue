<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import TenantDetailSidebar from '~/components/dashboard/superadmin/TenantDetailSidebar.vue'
import TenantDetailPage from '~/components/pages/superadmin/TenantDetailPage.vue'

definePageMeta({
  layout: 'superadmin',
  middleware: ['auth'],
})

useSeoMeta({
  title: 'Tenant Detail',
  ogTitle: 'Tenant Detail',
})

const route = useRoute()
const router = useRouter()
const tenantId = route.params.id as string
const { data, pending, error } = await useFetch(`/api/superadmin/tenants/${tenantId}`)
const tenant = computed(() => data.value as any)

const sidebarOpen = ref(false)
const section = computed(() => route.query.section as string || 'detail')

function navigateToSection(s: string) {
  router.push({ query: { section: s } })
}

const sectionComponents: Record<string, any> = {
  detail: TenantDetailPage,
  dashboard: defineAsyncComponent(() => import('~/components/pages/admin/DashboardPage.vue')),
  reports: defineAsyncComponent(() => import('~/components/pages/admin/ReportPage.vue')),
  departments: defineAsyncComponent(() => import('~/components/dashboard/departments/TableDepartments.vue')),
  doctors: defineAsyncComponent(() => import('~/components/dashboard/doctors/TableDoctors.vue')),
  nurses: defineAsyncComponent(() => import('~/components/dashboard/nurses/TableNurse.vue')),
  patients: defineAsyncComponent(() => import('~/components/dashboard/patient/TablePatient.vue')),
  'users-management': defineAsyncComponent(() => import('~/components/dashboard/users/TableUser.vue')),
  roles: defineAsyncComponent(() => import('~/components/dashboard/roles/TableRole.vue')),
  permissions: defineAsyncComponent(() => import('~/components/dashboard/permissions/TablePermissions.vue')),
  'log-activity': defineAsyncComponent(() => import('~/components/dashboard/LogActivity/TableLog.vue')),
  settings: defineAsyncComponent(() => import('~/components/pages/admin/SettingsPage.vue')),
}

const currentComponent = computed(() => {
  return sectionComponents[section.value] || null
})
</script>

<template>
  <TenantDetailSidebar v-model="sidebarOpen" :slug="tenant.slug" :active-section="section"
    @navigate="navigateToSection" />

  <KeepAlive>
    <component v-if="currentComponent" :is="currentComponent" :key="section" />
  </KeepAlive>
</template>
