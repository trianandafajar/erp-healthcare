export default defineNuxtPlugin(async () => {
    if (import.meta.server) return

    await ensureAuthState().catch(() => null)
})
