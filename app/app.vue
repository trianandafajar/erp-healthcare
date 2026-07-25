<script setup lang="ts">
const APP_NAME = 'Healthcare'
const DEFAULT_DESCRIPTION = 'Healthcare management platform for appointments, medical records, pharmacy, billing, and operations.'
const DEFAULT_LOADING_COLOR = '#176D37'

const authStore = useAuthStore()
const profileStore = useProfileStore()
const route = useRoute()

const GUEST_ROUTES = ['/', '/login', '/register', '/forgot-password', '/verify']

const showSkeletonForRoute = computed(() => {
  return !GUEST_ROUTES.includes(route.path)
})

const showSkeleton = ref(true)

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

onMounted(async () => {
  if (!profileStore.loaded) {
    try {
      await profileStore.fetchProfile()
    } catch { /* ignore */ }
  }
  await new Promise(resolve => requestAnimationFrame(resolve))
  showSkeleton.value = false
})
</script>

<template>
  <NuxtLoadingIndicator v-if="!showSkeleton" :color="loadingBarColor" :height="4" />
  <GlobalLoadingSkeleton v-if="showSkeleton && showSkeletonForRoute" />
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>
