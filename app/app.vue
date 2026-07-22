<script setup lang="ts">
const APP_NAME = 'Healthcare'
const DEFAULT_DESCRIPTION = 'Healthcare management platform for appointments, medical records, pharmacy, billing, and operations.'
const DEFAULT_LOADING_COLOR = '#176D37'

const authStore = useAuthStore()
const profileStore = useProfileStore()

const loadingBarColor = computed(() => {
  if (authStore.role === 'superadmin') return DEFAULT_LOADING_COLOR
  return profileStore.data?.tenant?.brand_color ?? DEFAULT_LOADING_COLOR
})

useHead({
  titleTemplate: (title) => {
    const normalizedTitle = typeof title === 'string' ? title.trim() : ''
    return normalizedTitle ? `${normalizedTitle} | ${APP_NAME}` : APP_NAME
  },
})

useSeoMeta({
  ogSiteName: APP_NAME,
  applicationName: APP_NAME,
  description: DEFAULT_DESCRIPTION,
  ogDescription: DEFAULT_DESCRIPTION,
})
</script>

<template>
  <NuxtLoadingIndicator :color="loadingBarColor" :height="4" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
