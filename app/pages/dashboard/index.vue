<script setup lang="ts">
definePageMeta({
    middleware: ['authorize'],
})

const authState = await ensureAuthState().catch(() => null)

if (!authState?.user) {
    await navigateTo('/login', { replace: true })
} else {
    const authStore = useAuthStore()
    const target = getDashboardPath(authState.role, authState.tenantSlug ?? authStore.tenantSlug)
    await navigateTo(target ?? '/403', { replace: true })
}
</script>

<template>
    <div />
</template>
