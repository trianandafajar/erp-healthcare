import type { SupabaseClient } from '@supabase/supabase-js'

export const useSupabase = (): SupabaseClient | null => {
    const nuxtApp = useNuxtApp()
    return nuxtApp.$supabase ?? null
}
