export const useSupabase = () => {
    if (import.meta.server) return null

    const nuxtApp = useNuxtApp()
    return nuxtApp.$supabase
}